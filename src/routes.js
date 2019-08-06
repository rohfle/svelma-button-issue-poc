import MainPage from './routes/MainPage.svelte'
import TheErrorRoute from './routes/TheErrorRoute.svelte'
import TheSuccessRoute from './routes/TheSuccessRoute.svelte'
import NotFound from './routes/NotFound.svelte'

export default {
    // Exact path
    '/': MainPage,
    '/problem/:id': TheErrorRoute,
    '/ok/:id': TheSuccessRoute,
    // Catch-all, must be last
    '*': NotFound,
}
