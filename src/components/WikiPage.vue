<script setup>
import { ref, watch, onMounted } from 'vue'
import { getPageDom } from '../wikipedia'
const props = defineProps({
  page: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['changePage'])
const html = ref('')
const fetchPage = async (page) => {
    if (!page) return
    html.value = ''
    const doc = await getPageDom(page)
    for (const element of Array.from(doc.querySelectorAll('div figure, div div, .noprint, .mw-editsection, .infobox_v2, .infobox_v3'))) {
        element.parentNode.removeChild(element)
    }
    for (const a of Array.from(doc.querySelectorAll('a'))) {
        const href = a.getAttribute('href')
        if (!href || href.startsWith('/wiki/')) continue;
        a.insertAdjacentHTML('afterend', a.innerHTML)
        a.parentNode.removeChild(a)
    }
    html.value = doc.innerHTML
    document.getElementsByTagName('article')[0].scrollTo(0, 0)
}
watch(() => props.page, fetchPage)
onMounted(async () => {
    await fetchPage(props.page)
})

const onClick = event => {
    event.stopPropagation()
    event.preventDefault()
    if (event.target.tagName !== 'A') return;

    const article = document.getElementsByTagName('article')[0]
    const range = document.createRange()
    range.setStart(article, 0)
    range.setEndBefore(event.target)
    const pos = range.extractContents().textContent.length
    emit('changePage', event.target.getAttribute('title'), pos, article.textContent.length)
}

</script>

<template>
    <h1>{{ page }}</h1>
    <article v-html="html" @click.capture="onClick"></article>
</template>

<style scoped>
h1 {
    display: inline;
}
article {
    overflow-y: scroll;
}
</style>
