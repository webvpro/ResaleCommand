<template>
    <div>
        <div v-if="!hideUpload" class="grid grid-cols-2 gap-2 mt-1">
            <button @click="$refs.fileInput.click()" class="btn btn-sm btn-outline border-dashed gap-2">
                <Icon icon="solar:folder-with-files-linear" class="w-4 h-4 inline" /> Upload
            </button>
            <input type="file" ref="fileInput" multiple accept="image/*" class="hidden" @change="handleFileSelect" />
            
            <button @click="startCamera" class="btn btn-sm btn-outline border-dashed gap-2">
                <Icon icon="solar:camera-linear" class="w-4 h-4 inline" /> Camera
            </button>
        </div>
        <div v-else class="w-full mt-1">
            <button @click="startCamera" class="btn btn-sm btn-outline border-dashed gap-2 w-full">
                <Icon icon="solar:camera-linear" class="w-4 h-4 inline" /> Open Camera
            </button>
        </div>

        <dialog ref="cameraModal" class="modal">
            <div class="modal-box p-0 bg-black w-full max-w-none h-dvh max-h-none rounded-none flex flex-col overflow-hidden shadow-none relative">
                <video ref="cameraVideoDialog" class="absolute inset-0 w-full h-full object-cover" autoplay playsinline></video>
                
                <!-- Top Bar -->
                <div class="absolute top-0 left-0 right-0 bg-linear-to-b from-black/80 to-transparent p-4 flex justify-between items-center text-white z-10 pt-safe">
                    <span class="font-bold drop-shadow-md">Camera</span>
                    <span class="badge badge-primary">{{ photos.length }} Photo(s)</span>
                </div>
                
                <!-- Thumbnails (Bottom Left) -->
                <div v-if="photos.length > 0" class="absolute bottom-32 left-4 right-4 flex gap-2 overflow-x-auto z-10 pointer-events-auto p-2">
                    <div v-for="(photo, idx) in photos" :key="idx" class="w-16 h-16 shrink-0 border-2 border-white/50 rounded-md overflow-hidden bg-black/50 shadow-lg">
                        <img :src="getObjectUrl(photo)" class="w-full h-full object-cover">
                    </div>
                </div>
                
                <!-- Bottom Controls -->
                <div class="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-8 flex justify-between items-center z-10 pb-safe">
                    <button @click.prevent="stopCamera" class="btn btn-ghost text-white px-2">Done</button>
                    <button @click.prevent="capturePhoto" class="btn btn-circle btn-primary btn-lg border-4 border-white w-20 h-20 transform active:scale-95 transition-transform shadow-xl"></button>
                    <button @click.prevent="flipCamera" class="btn btn-circle btn-ghost text-white bg-white/20"><Icon icon="solar:refresh-circle-linear" class="w-6 h-6" /></button>
                </div>
            </div>
        </dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
    photos: {
        type: Array,
        default: () => []
    },
    hideUpload: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['photos-captured']);

const objectUrls = new WeakMap();
const getObjectUrl = (file) => {
    if (!file) return '';
    if (!objectUrls.has(file)) objectUrls.set(file, URL.createObjectURL(file));
    return objectUrls.get(file);
};

const cameraVideoDialog = ref(null);
const cameraModal = ref(null);
const isCameraOpen = ref(false);
const cameraStream = ref(null);
const cameraFacing = ref('environment');

const handleFileSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    emit('photos-captured', Array.from(files));
    e.target.value = ''; // Reset
};

const startCamera = async () => {
    if (!cameraModal.value) return;
    cameraModal.value.showModal();
    isCameraOpen.value = true;
    try {
        if (cameraStream.value) {
            cameraStream.value.getTracks().forEach(track => track.stop());
        }
        cameraStream.value = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing.value }
        });
        if (cameraVideoDialog.value) {
             cameraVideoDialog.value.srcObject = cameraStream.value;
        }
    } catch (err) {
        alert("Could not access camera: " + err.message);
        stopCamera();
    }
};

const stopCamera = () => {
    if (cameraStream.value) {
         cameraStream.value.getTracks().forEach(track => track.stop());
         cameraStream.value = null;
    }
    isCameraOpen.value = false;
    if (cameraModal.value) cameraModal.value.close();
};

const flipCamera = () => {
    cameraFacing.value = cameraFacing.value === 'user' ? 'environment' : 'user';
    stopCamera();
    startCamera();
};

const capturePhoto = () => {
    const videoEl = cameraVideoDialog.value;
    if (!videoEl) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth; 
    canvas.height = videoEl.videoHeight;
    canvas.getContext('2d').drawImage(videoEl, 0, 0);
    
    canvas.toBlob(blob => {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        emit('photos-captured', [file]);
        
        // Visual feedback
        const btn = document.activeElement;
        if(btn) btn.classList.add('scale-90');
        setTimeout(() => btn && btn.classList.remove('scale-90'), 100);
    }, 'image/jpeg', 0.8);
};

onUnmounted(() => {
    stopCamera();
});

defineExpose({
    startCamera
});

</script>
