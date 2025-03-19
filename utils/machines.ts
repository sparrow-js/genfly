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


export const updateFileList = async (appName: string, files: Array<{path: string, content: string}>, installDependencies: string) => {
    const machine = await ensureMachineReady(appName);

    const execUrl = `https://api.machines.dev/v1/apps/${appName}/machines/${machine.id}/exec`;
    const filePath = files.map((file: any) => file.path);


    // 如果有package.json文件，重新安装依赖
    const hasPackageJson = filePath.find((key: any) => key.includes('package.json'));
    if (!hasPackageJson && installDependencies) {
        const reinstallResult = await reinstallDependencies(appName, installDependencies, hasPackageJson, machine);
        console.log('Reinstall dependencies result:', reinstallResult);
    }
    
    // 创建基于文件大小的批次
    const MAX_BATCH_SIZE_KB = 15; // 最大批次大小，单位KB
    const MAX_BATCH_SIZE = MAX_BATCH_SIZE_KB * 1024; // 转换为字节
    
    // 根据文件大小分组
    const batches: Array<Array<{path: string, content: string}>> = [];
    let currentBatch: Array<{path: string, content: string}> = [];
    let currentBatchSize = 0;
    
    // 首先估算每个文件的大小并进行分组
    for (const file of files) {
        const estimatedSize = new TextEncoder().encode(file.content).length;
        
        // 如果文件本身就超过限制，单独放一个批次
        if (estimatedSize > MAX_BATCH_SIZE) {
            console.log(`Large file ${file.path}: ${(estimatedSize/1024).toFixed(2)}KB, adding as separate batch`);
            batches.push([file]);
            continue;
        }
        
        // 如果添加此文件后会超出批次大小限制，创建新批次
        if (currentBatchSize + estimatedSize > MAX_BATCH_SIZE) {
            if (currentBatch.length > 0) {
                batches.push(currentBatch);
                currentBatch = [];
                currentBatchSize = 0;
            }
        }
        
        // 将文件添加到当前批次
        currentBatch.push(file);
        currentBatchSize += estimatedSize;
    }
    
    // 添加最后一个批次（如果有的话）
    if (currentBatch.length > 0) {
        batches.push(currentBatch);
    }
    
    console.log(`Created ${batches.length} batches from ${files.length} files`);
    
    // 处理所有批次，使用串行处理以避免频率限制
    const results = [];
    
    // 处理单个批次的函数
    async function processBatch(batch: Array<{path: string, content: string}>) {
        try {
            console.log(`Processing batch with ${batch.length} files`);
            
            // 准备批量上传的文件内容
            const batchFileOps = await Promise.all(batch.map(async (file) => {
                const safeFilePath = file.path.replace(/[^a-zA-Z0-9\/._-]/g, '');
                
                // 压缩文件内容
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
                
                return {
                    path: safeFilePath,
                    content: base64CompressedContent
                };
            }));
            
            // 为每个文件创建目录
            for (const fileOp of batchFileOps) {
                const mkdirCommand = [
                    "sh", "-c",
                    `mkdir -p "$(dirname '${fileOp.path}')"`
                ];
                
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
                    console.warn(`Warning creating directory for ${fileOp.path}: ${errorText}`);
                }
            }
            
            // 批量写入文件
            // 创建临时脚本文件来处理所有文件写入
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 10);
            const scriptPath = `/tmp/write_files_${timestamp}_${randomId}.sh`;
            
            // 构建脚本内容
            let scriptContent = '#!/bin/sh\n\n';
            
            batchFileOps.forEach((fileOp, index) => {
                const tempFile = `/tmp/temp_${timestamp}_${index}`;
                scriptContent += `# Write file ${index+1}/${batchFileOps.length}: ${fileOp.path}\n`;
                scriptContent += `echo '${fileOp.content}' | base64 -d > ${tempFile}\n`;
                scriptContent += `gunzip -c ${tempFile} > '${fileOp.path}'\n`;
                scriptContent += `rm ${tempFile}\n\n`;
            });
            
            // 写入脚本文件
            const writeScriptCommand = [
                "sh", "-c",
                `cat > ${scriptPath} << 'EOFSCRIPT'\n${scriptContent}\nEOFSCRIPT\nchmod +x ${scriptPath}`
            ];
            
            const writeScriptResponse = await fetch(execUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${flyToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command: writeScriptCommand,
                    timeout: 60
                }),
            });
            
            if (!writeScriptResponse.ok) {
                const errorText = await writeScriptResponse.text();
                throw new Error(`Failed to create batch script: ${writeScriptResponse.status} - ${errorText}`);
            }
            
            // 执行脚本
            const executeScriptCommand = [
                "sh", "-c",
                `${scriptPath} && rm ${scriptPath}`
            ];
            
            const executeResponse = await fetch(execUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${flyToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command: executeScriptCommand,
                    timeout: 120 // 给予更多时间执行批处理
                }),
            });
            
            if (!executeResponse.ok) {
                const errorText = await executeResponse.text();
                throw new Error(`Failed to execute batch script: ${executeResponse.status} - ${errorText}`);
            }
            
            const result = await executeResponse.json();
            
            // 检查脚本执行结果
            if (result.exit_code !== 0) {
                console.error(`Batch script execution failed with code ${result.exit_code}`);
                console.error(`STDOUT: ${result.stdout}`);
                console.error(`STDERR: ${result.stderr}`);
                throw new Error(`Batch script execution failed with code ${result.exit_code}`);
            }
            
            return {
                success: true,
                batchSize: batch.length,
                result: result
            };
        } catch (error) {
            console.error('Error processing batch:', error);
            return {
                success: false,
                batchSize: batch.length,
                error: error
            };
        }
    }
    
    // 串行处理所有批次以避免触发频率限制
    async function processAllBatchesSerially() {
        const batchResults = [];
        
        console.log(`Starting serial processing of ${batches.length} batches`);
        
        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i+1}/${batches.length}`);
            try {
                console.log(`Processing ********** time: ${new Date().toISOString()}`);
                const result = await processBatch(batches[i]);
                batchResults.push(result);
                
                // 在批次之间添加延迟，避免API限制
                if (i < batches.length - 1) {
                    console.log(`Adding delay between batches (2 second)`);
                    await new Promise(resolve => setTimeout(resolve, 4000));
                }
            } catch (error) {
                console.error(`Error processing batch ${i+1}:`, error);
                batchResults.push({
                    success: false,
                    batchSize: batches[i].length,
                    error: error
                });
            }
        }
        
        return batchResults;
    }
    
    // 处理所有批次并获取结果
    const batchResults = await processAllBatchesSerially();
    
    // 组织返回结果
    const allSuccessful = batchResults.every(result => result.success);
    const totalProcessed = batchResults.reduce((sum, result) => sum + (result.batchSize || 0), 0);
    
    console.log(`Processed ${totalProcessed}/${files.length} files, success: ${allSuccessful}`);
    
    if (hasPackageJson) {
        const reinstallResult = await reinstallDependencies(appName, installDependencies, hasPackageJson, machine);
        console.log('Reinstall dependencies result:', reinstallResult);
    }
    
    
    return allSuccessful;
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

export const reinstallDependencies = async (appId: string, installDependencies: string, hasPackageJson: boolean, machine: any) => {
  try {
    // Execute npm install with retry logic
    let installResult: any;
    
    try {
      // First navigate to the app directory
      const cdResult = await executeCommand(appId, machine.id, ['sh', '-c', 'cd /app']);
      console.log('Changed to app directory:', cdResult);
      let installCommand = 'npm install';
      if (!hasPackageJson && installDependencies) {
        installCommand = installDependencies;
      }

      console.log('installCommand', ['sh', '-c', `cd /app && ${installCommand}`]);
      // Run npm install in the app directory
      installResult = await executeCommand(appId, machine.id, ['sh', '-c', `cd /app && ${installCommand}`]);
            
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

