<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeMount, inject } from 'vue'
import qs from 'fast-querystring'
import { getDayPages } from './wikipedia'
import History from './components/History.vue'
import WikiPage from './components/WikiPage.vue'
import OldGames from './components/OldGames.vue'

// state
const target = ref('-')
const history = reactive([
])
const missedHistory = reactive([])
const page = computed(() => history[history.length - 1] || '')
const score = ref(0)
const victory = ref(false)
const copiedToClipbaord = ref(false)
const selectOldGame = ref(false)

// game mechanics
const changePage = (newPage, pos = 0, size) => {
    if (!newPage || page.value === newPage) return
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
const shareVictory = async event => {
    const text = `Je me suis rendu de 🏁 ${history[0]} à 🎯 ${target.value} en seulement ${history.length} étapes et ${score.value} points sur ${location.href.replace(/#.*/, '')}.`
    await navigator.clipboard.writeText(text)
    copiedToClipbaord.value = true
}


// hash navigation
watch(page, (value) => {
    location.hash = `#${page.value}`
    if (target.value === page.value) {
        victory.value = true
        const scores = $cookies.get('score_history') || {}
        scores[today] = {
            steps: history.length,
            score: score.value,
        }
        $cookies.set('score_history', JSON.stringify(scores))
    }
})
let gameInitResolve
let gameInitPromise = new Promise(resolve => { gameInitResolve = resolve })
onMounted(async () => {
    await gameInitPromise
    location.hash = `#${page.value}`
    window.addEventListener('hashchange', () => {
        const newPage = decodeURIComponent(location.hash.replace(/^#/, ''))
        if (history.length > 1 && history[history.length - 2] === newPage) {
            backPage()
        } else {
            changePage(newPage)
        }
    })
})

// game status
const $cookies = inject('$cookies')
const DAY = 86400 * 1000
let today = new Date(Math.floor(Date.now() / DAY) * DAY ).toISOString()
const args = qs.parse(location.search.replace(/^\?/, ''))
if (args.date) today = new Date(args.date).toISOString()
console.log('today', today, args)
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
    const pages = await getDayPages(today)

    if (state && state.today === today && state.history[0] === pages.start && state.target === pages.target) {
        // restore game
        target.value = state.target
        history.push(...state.history)
        missedHistory.push(...state.missedHistory)
        score.value = state.score
        gameInitResolve()
        return
    }
    // reset game
    history.splice(0, history.length, pages.start)
    target.value = pages.target
    score.value = 0
    missedHistory.splice(0, missedHistory.length)
    gameInitResolve()
})
    
const showOldGames = () => {
    selectOldGame.value = true
}
const hideOldGames = () => {
    selectOldGame.value = false
}
const hideVictory = () => {
    victory.value = false
}
</script>

<template>
  <header>
      <h1>Walkipedia</h1>
      <div class="target"> Rendez vous sur la page 🎯 <strong><a :href="`https://fr.wikipedia.org/wiki/${target}`" target="_blank">{{target}}</a></strong> avec le moins de clics possibles</div>
      <button id="showOldGames" @click="showOldGames" title="Partie précédentes">📅</button>
      <iframe id="github" src="https://ghbtns.com/github-btn.html?user=Puyb&repo=walkipedia&type=star&size=large" frameborder="0" scrolling="0" width="80" height="30" title="GitHub"></iframe>
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
  <div class="modal" v-show="victory">
      <div class="modal-content">
          <button class="close" @click="hideVictory" title="Fermer">❌</button>
        <h1>🏆 Bravo 🏆</h1>
        <div>
            Vous vous êtes rendu de 🏁 <strong>{{history[0]}}</strong> à 🎯 <strong>{{target}}</strong> en seulement {{history.length}} étapes et {{score}} points !
        </div>
        <div>
            Rendez vous demain pour un nouveau défi ! 👋
        </div>
        <button @click="shareVictory">Partager mon résultat</button>
        <span v-if="copiedToClipbaord">Résultat copié dans le presse-papier</span>
      </div>
    </div>
  <div class="modal" v-show="selectOldGame">
      <div class="modal-content">
          <button class="close" @click="hideOldGames" title="Fermer">❌</button>
          <OldGames />
      </div>
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
#showOldGames {
    position: absolute;
    top: 3px;
    right: 120px;
    font-size: 1.5em;
    background: transparent;
    border: none;
}
.target {
    display: inline;
}
.modal {
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: auto; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

.modal-content {
    position: relative;
    background-color: #202020;
    margin: 50px auto; /* 15% from the top and centered */
    border-left-width: 2px;
    border-color: white;
    padding: 10px;
    border-radius: 5px;
    border-style: solid;
    width: 80%; /* Could be more or less, depending on screen size */
    max-height: calc(100% - 100px);
    overflow-y: auto;
}
.modal button {
    margin: 10px;
}
.modal .close {
    position: absolute;
    top: -5px;
    right: -5px;
    z-index: 10;
}
#back {
    display: inline-block;
    margin-right: 10px;
    font-size: 2em;
}
#github {
    position: absolute;
    right: 10px;
    top: 5px;
}
</style>
