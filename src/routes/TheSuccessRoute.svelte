<script>

import Button from 'svelma/src/components/Button.svelte'
import {link, pop} from 'svelte-spa-router';

console.log(Button)

</script>

<Button>A button that does nothing</Button>

<a href="/" use:link>This will succeed</a>
