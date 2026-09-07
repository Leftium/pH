<script lang="ts">
	import '@leftium/nimble.css/core';

	let { children } = $props();
</script>

{@render children()}

<style>
	:global(:root) {
		--nc-content-width: 45ch;
	}
</style>
