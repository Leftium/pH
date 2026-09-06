<script lang="ts">
	import { generatePassword } from '#lib/pwdhash/Password.gen.tsx';

	const generatedPassword = generatePassword('https://www.example.com', 'password');
</script>

<h1>pH v2</h1>
{#if generatedPassword.TAG === 'Ok'}
	<p>Generated ReScript output: {generatedPassword._0}</p>
{:else}
	<p>Generation failed: {generatedPassword._0}</p>
{/if}
