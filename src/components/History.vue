<script setup>
const props = defineProps({
  history: Array
})
</script>

<template>
    <ul>
        <li v-for="page in history">📌 {{ page }}</li>
    </ul>
</template>

<style scoped>
ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}
</style>
