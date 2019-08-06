<script>
import {Button} from 'svelma'
 import {link, pop} from 'svelte-spa-router';

console.log(Button)

</script>

<Button> A button that does nothing</Button>

<a href="/" use:link>This will error</a>
