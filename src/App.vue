<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeMount, inject } from 'vue'
import { getDayPages } from './wikipedia'
import History from './components/History.vue'
import WikiPage from './components/WikiPage.vue'

// state
const target = ref('Atome')
const history = reactive([
    'Autriche'
])
const missedHistory = reactive([])
const page = computed(() => history[history.length - 1])
const score = ref(0)

// game mechanics
const changePage = (newPage, pos = 0, size) => {
    if (page.value === newPage) return;
    console.log('newPage', newPage, 'pos', pos, 'size', size)
    history.push(newPage)
    const missedPos = missedHistory.indexOf(newPage)
    if (missedPos >= 0) missedHistory.splice(missedPos, 1)
    score.value += pos
}
const backPage = () => {
    const oldPage = page.value
    history.splice(-1, 1)
    if (!missedHistory.includes(oldPage)) missedHistory.push(oldPage)
}



// hash navigation
watch(page, (value) => {
    location.hash = `#${page.value}`
})
onMounted(() => {
    location.hash = `#${page.value}`
    window.addEventListener('hashchange', () => {
        const newPage = decodeURIComponent(location.hash.replace(/^#/, ''))
        if (history.length > 1 && history[history.length - 2] === newPage) {
            backPage();
        } else {
            changePage(newPage)
        }
    })
})

// game status
const $cookies = inject('$cookies');
const today = new Date(Math.ceil(Date.now() / 86400 / 1000)).toISOString();
watch([target, history, missedHistory, score], () => {
    $cookies.set('status', JSON.stringify({
        target: target.value,
        history,
        missedHistory,
        score: score.value,
        today
    }))
})
onBeforeMount(async () => {
    const state = $cookies.get('status')
    // new game
    const pages = await getDayPages(today)

    if (state && state.today === today && state.history[0] === pages.start && state.target === pages.target) {
        target.value = state.target
        history.push(...state.history.slice(1))
        missedHistory.push(...state.missedHistory)
        score.value = state.score
        return
    }
    // reste game
    history.splice(0, history.length, pages.start)
    target.value = pages.target
    score.value = 0
    missedHistory.splice(0, missedHistory.length)
})
    
</script>

<template>
  <header>
      <h1>Walkipedia</h1>
      <div class="target"> Rendez vous sur la page 🎯 <strong><a :href="`https://fr.wikipedia.org/wiki/${target}`" target="_blank">{{target}}</a></strong> avec le moins de clics possibles</div>
  </header>

  <main>
    <div class="left-container">
        <button id="back" @click="backPage" v-if="history.length > 1">⇦</button>
        <WikiPage :page="page" @changePage="changePage" />
    </div>
    <div class="right-container">
        <div>Score: {{ score }}</div>
        <h1>Votre chemin :</h1>
        <History :history="history" />
        <h1>Deja vu :</h1>
        <History :history="missedHistory" />
    </div>
  </main>
  <div id="modal" v-show="target === page">
      <h1>🏆 Bravo 🏆</h1>
      Vous vous êtes rendu de 🏁 <strong>{{history[0]}}</strong> à 🎯 <strong>{{target}}</strong> en seulement {{history.length}} étapes et {{score}} points !
  </div>
</template>

<style scoped>
main {
  flex-flow:row wrap;
  display:flex;
  align-items:center;
  justify-content:center;
  height:calc(100vh - 60px)
}
main .left-container {
  height:calc(100vh - 60px);
  overflow-y:auto;
  padding:0 20px;
  width:70%
}
@media screen and (max-width:800px) {
  main .left-container {
    width:100%;
    height:60%
  }
}
main .left-container h1 {
  color:var(--color-text)
}
main .right-container {
  height:calc(100vh - 60px);
  overflow-y:auto;
  padding:0 20px;
  width:30%
}
@media screen and (max-width:800px) {
  main .right-container {
    width:100%;
    height:40%
  }
}
header h1 {
    display: inline-block;
    margin: 1px 10px;
}
.target {
    display: inline;
}
#modal {
    position: absolute;
    background: #202020;
    z-index: 10;
    top: 50%;
    left: 50%;
    width: 600px;
    height: 200px;
    margin-left: -300px;
    margin-top: -100px;
    border-left-width: 2px;
    border-color: white;
    padding: 10px;
    border-radius: 5px;
    border-style: solid;
}
#back {
    display: inline-block;
    margin-right: 10px;
    font-size: 2em;
}
</style>