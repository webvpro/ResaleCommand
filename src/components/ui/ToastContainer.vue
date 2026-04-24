<template>
  <div class="toast toast-end toast-bottom z-[9999] flex flex-col gap-2 p-4 fixed bottom-0 right-0 pointer-events-none">
    <transition-group name="toast-slide">
        <div 
            v-for="toast in activeToasts" 
            :key="toast.id" 
            class="alert shadow-lg pointer-events-auto min-w-[300px] flex flex-col items-start gap-1"
            :class="{
                'alert-info': toast.type === 'info' || toast.type === 'loading',
                'alert-success': toast.type === 'success',
                'alert-warning': toast.type === 'warning',
                'alert-error': toast.type === 'error'
            }"
        >
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-2">
                    <span v-if="toast.type === 'loading'" class="loading loading-spinner loading-xs"></span>
                    <Icon v-else-if="toast.type === 'success'" icon="solar:check-circle-linear" class="w-5 h-5" />
                    <Icon v-else-if="toast.type === 'error'" icon="solar:danger-circle-linear" class="w-5 h-5" />
                    <Icon v-else-if="toast.type === 'warning'" icon="solar:danger-triangle-linear" class="w-5 h-5" />
                    <Icon v-else icon="solar:info-circle-linear" class="w-5 h-5" />
                    <span class="text-sm font-medium">{{ toast.message }}</span>
                </div>
                <button v-if="toast.type !== 'loading'" class="btn btn-xs btn-ghost btn-circle" @click="remove(toast.id)">✕</button>
            </div>
            
            <div v-if="toast.progress !== undefined" class="w-full bg-base-100/20 rounded-full h-1.5 mt-1 overflow-hidden">
                <div class="bg-current h-full transition-all duration-300" :style="{ width: toast.progress + '%' }"></div>
            </div>
        </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useStore } from '@nanostores/vue';
import { toasts, removeToast } from '../../stores/toast';
import { Icon } from '@iconify/vue';

const activeToasts = useStore(toasts);

function remove(id: string) {
    removeToast(id);
}
</script>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
