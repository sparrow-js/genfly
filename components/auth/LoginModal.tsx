import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" />
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[90vw] md:w-[400px]"
          >
            <Dialog.Content className="bg-white dark:bg-[#0A0A0A] rounded-lg p-6 border border-[#E5E5E5] dark:border-[#1A1A1A] shadow-xl">
              <Dialog.Title className="sr-only">Sign in to continue</Dialog.Title>
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mx-auto w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-500"
                >
                  <div className="i-ph:user-circle w-6 h-6" />
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sign in to continue</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create an account or sign in to send messages
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <Link href="/login" className="w-full">
                    <Button 
                      className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Button 
                    variant="secondary"
                    className="w-full" 
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </motion.div>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 