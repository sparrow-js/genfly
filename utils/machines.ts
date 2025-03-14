import { gzip } from 'pako';

// import { promisify } from 'util';
// import { gzip, gunzip } from 'zlib';


// // Promisify zlib functions for async/await usage
// const gzipAsync = promisify(gzip);
// const gunzipAsync = promisify(gunzip);

function arrayBufferToBase64(buffer: any) {
  const binary = String.fromCharCode.apply(null, buffer);
  return btoa(binary);
}

const flyToken = process.env.FLY_API_TOKEN;


export const createFlyApp = async (appName: string) => {
    const response = await fetch('https://api.machines.dev/v1/apps', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${flyToken}`,
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        org_slug: 'personal',
        app_name: appName,
        enable_subdomains: true,
        }),
    });

    const data = await response.json();
    return data;
};


export const provisionIPsApp = async (appId: string) => {
    // Provision IPs for the application using GraphQL API
    // Provision IPs for the application - both IPv6 (dedicated) and IPv4 (shared)
    const provisionIPv6Response = await fetch('https://api.fly.io/graphql', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${flyToken}`,
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        query: `
            mutation($appId: ID!) {
            allocateIpAddress(input: {
                appId: $appId,
                type: v6
            }) {
                ipAddress {
                id
                address
                type
                }
            }
            }
        `,
        variables: {
            appId: appId
        }
        }),
    });

    const provisionIPv6Data = await provisionIPv6Response.json();

    const provisionSharedIPv4Response = await fetch('https://api.fly.io/graphql', {
        method: 'POST',
        headers: {
        'Authorization': `Bearer ${flyToken}`,
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        query: `
            mutation($appId: ID!) {
            allocateIpAddress(input: {
                appId: $appId,
                type: shared_v4
            }) {
                ipAddress {
                id
                address
                type
                }
            }
            }
        `,
        variables: {
            appId: appId
        }
        }),
    });

    const provisionSharedIPv4Data = await provisionSharedIPv4Response.json();

    return {
        provisionIPv6Data,
        provisionSharedIPv4Data
    };
};


export const createMachine = async (appId: string, machineName: string) => {
    const machineResponse = await fetch(`https://api.machines.dev/v1/apps/${appId}/machines`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${flyToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: machineName,
            config: {
            image: 'registry.fly.io/ancodeai-app:latest',
            env: {
                FLY_PROCESS_GROUP: 'app',
                PRIMARY_REGION: 'ord',
                APP_ENV: 'production'
            },
            services: [
                {
                    ports: [
                        {
                        port: 443,
                        handlers: ['tls', 'http'],
                        },
                        {
                        port: 80,
                        handlers: ['http'],
                        }
                    ],
                    protocol: 'tcp',
                    internal_port: 8080,
                    force_https: true,
                    autostop: 'suspend',
                    autostart: true,
                    min_machines_running: 0,
                    processes: ['app'],
                },
            ],
            checks: {
                httpget: {
                type: 'http',
                port: 8080,
                method: 'GET',
                path: '/',
                interval: '15s',
                timeout: '10s'
                }
            },
            guest: {
                cpu_kind: 'shared',
                cpus: 1,
                memory: '1gb',
                memory_mb: 1024,
            },
            region: "ord"
            },
        }),
    });
        
    const machineData = await machineResponse.json();
    return machineData;
};



export const updateApp = async (appId: string, machineName: string) => {
    const machineResponse = await fetch(`https://api.machines.dev/v1/apps/${appId}/machines/${machineName}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${flyToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: machineName,
        }),
    });
};


export const sendGraphQLRequest = async (query: string, variables: any) => {
    try {
        const response = await fetch('https://api.fly.io/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${flyToken}`,
            },
            body: JSON.stringify({ query, variables }),
        });

        if (!response.ok) {
            throw new Error(`GraphQL 请求失败: ${response.status} - ${response.statusText}`);
        }

        const result: any = await response.json();
        if (result.errors) {
            throw new Error(`GraphQL 错误: ${JSON.stringify(result.errors)}`);
        }

        return result.data;
    } catch (error: any) {
        throw new Error(`发送 GraphQL 请求失败: ${error.message}`);
    }
}

export const getMachine = async (appName: string) => {
    const query = `
        query($appName: String!) {
            app(name: $appName) {
                machines {
                    nodes {
                        id
                        state
                        region
                    }
                }
            }
        }
    `;

    const variables = { appName: appName };
    const result = await sendGraphQLRequest(query, variables);

    const machines = result.app?.machines?.nodes || [];
    if (!machines.length) {
        console.error('未找到任何机器');
        return null;
    }
    
    return machines[0];
};


export const updateFileList = async (appName: string, files: Array<{path: string, content: string}>) => {
    const machine = await ensureMachineReady(appName);

    const execUrl = `https://api.machines.dev/v1/apps/${appName}/machines/${machine.id}/exec`;
    const filePath = files.map((file: any) => file.path);
    
    // Reduce batch size to handle payload size limitations
    const BATCH_SIZE = 10;
    const batches = [];

    let firstTag = true;
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        batches.push(files.slice(i, i + BATCH_SIZE));
    }
    
    const results = [];
    
    // Process each batch
    for (const batch of batches) {
        try {
            // Process files one by one within each batch to avoid payload issues
            for (const file of batch) {
                const safeFilePath = file.path.replace(/[^a-zA-Z0-9\/._-]/g, '');
                
                // Create directory first
                const mkdirCommand = [
                    "sh", "-c",
                    `mkdir -p "$(dirname '${safeFilePath}')"`
                ];
                
                // Execute mkdir command
                const mkdirResponse = await fetch(execUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${flyToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        command: mkdirCommand,
                        timeout: 30
                    }),
                });
                
                if (!mkdirResponse.ok) {
                    const errorText = await mkdirResponse.text();
                    console.warn(`Warning creating directory for ${safeFilePath}: ${errorText}`);
                    // Continue anyway as the directory might already exist
                }
                
                // Compress the content using gzip
                // const contentBuffer = Buffer.from(file.content, 'utf-8');
                // const compressedContent = await gzipAsync(contentBuffer);
                // const base64CompressedContent = compressedContent.toString('base64');
                const contentBuffer = new TextEncoder().encode(file.content);
                const compressedContent = await new Promise((resolve, reject) => {
                  try {
                    const data = gzip(contentBuffer);
                    resolve(data);
                  } catch (err) {
                    reject(err);
                  }
                });
                const base64CompressedContent = arrayBufferToBase64(compressedContent);
                
                console.log('Compressed content length:', base64CompressedContent.length);

                // Write compressed content to a temporary file, then decompress it to the target file
                const writeFileCommand = [
                    "sh", "-c",
                    `echo '${base64CompressedContent}' | base64 -d | gunzip > '${safeFilePath}'`
                ];
                
                // Execute write file command
                const writeResponse = await fetch(execUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${flyToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        command: writeFileCommand,
                        timeout: 60
                    }),
                });
                
                if (!writeResponse.ok) {
                    const errorText = await writeResponse.text();
                    throw new Error(`Failed to write file ${safeFilePath}: ${writeResponse.status} - ${errorText}`);
                }
                
                const result = await writeResponse.json();
                results.push(result);
                
                // Add a small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error('Error updating file:', error);
            throw error;
        }
    }

    if (filePath.find((key: any) => key.includes('package.json'))) {
        const reinstallResult = await reinstallDependencies(appName);
        console.log('Reinstall dependencies result:', reinstallResult);
    }
    
    // Log results for debugging but without exposing sensitive data
    console.log(`File update results: ${results.length} operations completed`, results);
    
    return results.every((result: any) => result.exit_code === 0);
};


/**
 * Check and handle machine status before file operations
 * @param appName The name of the Fly.io application
 * @returns The ready machine instance
 * @throws Error if machine cannot reach ready state
 */
const ensureMachineReady = async (appName: string) => {
  const maxRetries = 12;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    const machine = await getMachine(appName);
    
    switch (machine.state) {
      case 'started':
        console.log('Machine is started, returning it');
        return machine;
        
      case 'created':
        console.log('Machine is created, waiting for it to start ', retryCount * 5000);
        // Wait and retry for created state
        await new Promise(resolve => setTimeout(resolve, 5000));
        retryCount++;
        if (retryCount === maxRetries) {
          throw new Error(`Machine stuck in created state after maximum retries ${ retryCount * 4000} seconds`);
        }
        continue;
        
      case 'stopped':
      case 'suspended': {
        console.log('Machine is stopped or suspended, starting it');
        const startResponse = await startMachine(appName, machine.id);
        
        if (!startResponse || typeof startResponse !== 'object') {
          throw new Error('Failed to start machine: Invalid response');
        }
        
        // Wait briefly before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
        
      default:
        throw new Error(`Unexpected machine state: ${machine.state}`);
    }
  }
  
  throw new Error('Failed to get machine into ready state');
};


export const updateFile = async (appName: string, filePath: string, content: string) => {
    const machine = await getMachine(appName);

    // 使用 REST API 执行命令
    const execUrl = `https://api.machines.dev/v1/apps/${appName}/machines/${machine.id}/exec`;
    const safeFilePath = filePath.replace(/[^a-zA-Z0-9\/._-]/g, '');
    
    // Compress the content using gzip
    // const contentBuffer = Buffer.from(content, 'utf-8');
    // const compressedContent = await gzipAsync(contentBuffer);
    // const base64CompressedContent = compressedContent.toString('base64');

    const contentBuffer = new TextEncoder().encode(content);
    const compressedContent = await new Promise((resolve, reject) => {
      try {
        const data = gzip(contentBuffer);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
    const base64CompressedContent = arrayBufferToBase64(compressedContent);
    
    // Write compressed content and decompress on the server
    const command = [
        "sh", "-c",
        `echo '${base64CompressedContent}' | base64 -d | gunzip > '${safeFilePath}'`
    ];

    const response = await fetch(execUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${flyToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            command: command,
            timeout: 30
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`REST API 执行失败: ${response.status} - ${errorText}`);
    }

    const result: any = await response.json();
    return result.ok; // REST API 返回的成功标志
}


export const deployApp = async (appName: string) => {
    const appData = await createFlyApp(appName);
    if (!appData) {
        throw new Error('Failed to create Fly.io application');
    }

    const provisionData = await provisionIPsApp(appName);
    if (!provisionData) {
        throw new Error('Failed to provision IPs for Fly.io application');
    }

    const deployData = await createMachine(appName, `${appName}-machine`);
    if (!deployData) {  
        throw new Error('Failed to create machine for Fly.io application');
    }

    return {
        appData,
        provisionData,
        deployData
    };
};


export const checkDeploymentStatus = async (appId: string) => {
  try {

    const machine = await getMachine(appId);

    return machine;
  } catch (error) {
    console.error('Error checking deployment status:', error);
    throw error;
  }
};

export const listMachines: any = async (appId: string) => {
  try {
    const response = await fetch(`https://api.machines.dev/v1/apps/${appId}/machines`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${flyToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list machines: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing machines:', error);
    throw error;
  }
};

export const startMachine = async (appId: string, machineId: string) => {
  try {
    const response = await fetch(`https://api.machines.dev/v1/apps/${appId}/machines/${machineId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flyToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to start machine: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting machine:', error);
    throw error;
  }
};



export const executeCommand = async (appId: string, machineId: string, command: string[]) => {
  try {
    const response = await fetch(`https://api.machines.dev/v1/apps/${appId}/machines/${machineId}/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: command,
        timeout: 300 // 5 minutes timeout
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to execute command: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error executing command:', error);
    throw error;
  }
};

export const reinstallDependencies = async (appId: string) => {
  try {
    const machine = await getMachine(appId);
    if (!machine) {
      throw new Error('No machine found for the application');
    }
    
    // Execute npm install with retry logic
    let installResult: any;
    
    try {
      // First navigate to the app directory
      const cdResult = await executeCommand(appId, machine.id, ['sh', '-c', 'cd /app']);
      console.log('Changed to app directory:', cdResult);
      
      // Run npm install in the app directory
      installResult = await executeCommand(appId, machine.id, ['sh', '-c', 'cd /app && npm install']);
            
      // If we get here, the command succeeded or had non-fatal warnings
    } catch (error) {
      console.error("npm install attempt failed:", error);
    }
    
    console.log('Reinstall dependencies result:', installResult);

    return {
      installResult,
    };
  } catch (error) {
    console.error('Error reinstalling dependencies:', error);
    throw error;
  }
};

