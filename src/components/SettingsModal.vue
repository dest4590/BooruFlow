<script setup lang="ts">
import { ref } from "vue";
import { alwaysLoadHighRes, excludeAi, rule34ApiKey, rule34UserId } from "../composables/useSettings";
import BaseModal from "./BaseModal.vue";
import BaseSwitch from "./BaseSwitch.vue";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const localHighRes = ref(alwaysLoadHighRes.value);
const localExcludeAi = ref(excludeAi.value);
const localRule34ApiKey = ref(rule34ApiKey.value);
const localRule34UserId = ref(rule34UserId.value);

function handleClose() {
  alwaysLoadHighRes.value = localHighRes.value;
  excludeAi.value = localExcludeAi.value;
  rule34ApiKey.value = localRule34ApiKey.value?.trim();
  rule34UserId.value = localRule34UserId.value?.trim();
  emit("close");
}
</script>

<template>
  <BaseModal :open="open" title="Settings" @close="handleClose">
    <BaseSwitch
      v-model="localHighRes"
      label="Always Load High-Res"
      description="Load full resolution images instead of previews"
      color="#22c55e"
    />

    <BaseSwitch
      v-model="localExcludeAi"
      label="Exclude AI Content"
      description="Automatically exclude common AI tags from search"
      color="#3b82f6"
    />

    <div class="mt-4">
      <label class="block text-sm font-medium text-app-text">Rule34 API Key</label>
      <input
        v-model="localRule34ApiKey"
        type="text"
        placeholder="(optional)"
        class="mt-1 block w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm"
      />
      <p class="text-xs text-app-text-muted mt-1">Leave empty to use unauthenticated requests.</p>
    </div>

    <div class="mt-3">
      <label class="block text-sm font-medium text-app-text">Rule34 User ID</label>
      <input
        v-model="localRule34UserId"
        type="text"
        placeholder="(optional)"
        class="mt-1 block w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm"
      />
    </div>

    <template #footer>
      <button
        class="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border border-app-border text-app-text-muted hover:border-app-text-dim hover:text-app-text bg-app-bg-2"
        @click="handleClose"
      >
        Done
      </button>
    </template>
  </BaseModal>
</template>
