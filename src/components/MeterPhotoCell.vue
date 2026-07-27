<template>
  <div
    class="meter-photo-cell"
    :class="{
      'meter-photo-cell--filled': modelValue,
      'meter-photo-cell--empty': !modelValue,
      'meter-photo-cell--selected': selected,
      'meter-photo-cell--error': error,
    }"
    tabindex="0"
    @click="emit('select')"
    @paste="onPaste"
  >
    <img
      v-if="modelValue"
      :src="modelValue"
      alt="Foto do medidor"
      class="meter-photo-cell__img"
    />
    <button
      v-else
      type="button"
      class="meter-photo-cell__trigger"
      aria-label="Anexar foto do medidor"
      @click.stop="emit('pick')"
    >
      <q-icon name="add_a_photo" size="20px" color="grey-6" />
      <span class="meter-photo-cell__label">Foto *</span>
    </button>

    <q-btn
      v-if="modelValue"
      icon="close"
      round
      dense
      flat
      size="xs"
      color="negative"
      class="meter-photo-cell__clear"
      @click.stop="emit('update:modelValue', '')"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  selected?: boolean;
  error?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  select: [];
  pick: [];
}>();

function readFileAsync(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function onPaste(event: ClipboardEvent) {
  const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
    entry.type.startsWith('image/'),
  );
  if (!item) return;

  event.preventDefault();
  const file = item.getAsFile();
  if (!file) return;

  emit('update:modelValue', await readFileAsync(file));
}
</script>

<style scoped>
.meter-photo-cell {
  position: relative;
  width: 88px;
  height: 72px;
  border-radius: 8px;
  outline: none;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.meter-photo-cell--empty {
  border: 2px dashed var(--border-strong);
  background: var(--surface-muted);
}

.meter-photo-cell--filled {
  border: 1px solid var(--border);
}

.meter-photo-cell--selected {
  border-color: var(--q-primary, #2563eb) !important;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.meter-photo-cell--error {
  border-color: rgba(220, 38, 38, 0.75) !important;
  background: rgba(220, 38, 38, 0.05);
}

.meter-photo-cell__trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
}

.meter-photo-cell__label {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 600;
  line-height: 1.1;
  text-align: center;
}

.meter-photo-cell__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meter-photo-cell__clear {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(255, 255, 255, 0.92) !important;
}
</style>
