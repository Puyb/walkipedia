import md5 from 'md5-hash'

export const getPageDom = async page => {
    const response = await fetch(`https://fr.wikipedia.org/w/api.php?action=parse&format=json&page=${page}&prop=text&formatversion=2&origin=*&redirects`)
    const { parse: { text } } = await response.json()
    const doc = document.createElement('span')
    const fragment = document.createDocumentFragment()
    fragment.append(doc)
    doc.innerHTML = text
    return doc
}

export const getPages = async  () => {
    const specialPage = 'Wikipédia:RAW/2021-03-01/Articles_de_qualité'
    const doc = await getPageDom(specialPage)
    const pages = []
    for (const a of Array.from(doc.querySelectorAll('a'))) {
        const href = a.getAttribute('href')
        if (!href) continue;
        if (!href.startsWith('/wiki/')) continue;
        const title = a.getAttribute('title')
        if (!title) continue;
        pages.push(title)
    }
    return pages
}

export const getDayPages = async today => {
    const pages = await getPages()
    const hash = parseInt(md5(today), 16)
    return {
        start: pages[hash % pages.length],
        target: pages[(hash / pages.length) % pages.length]
    }
}

export const NAMESPACES = [
    'Utilisateur',
    'Wikipédia',
    'Fichier',
    'MediaWiki',
    'Modèle',
    'Aide',
    'Catégorie',
    'Portail',
    'Projet',
    'Référence',
    'TimedText',
    'Module',
    'Gadget',
    'Définition de gadget',
    'Sujet'
]
