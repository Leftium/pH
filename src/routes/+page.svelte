<script lang="ts">
	import { confirmationClass } from '#lib/pwdhash/Confirmation.gen.tsx';
	import { copyToClipboard } from '#lib/pwdhash/Clipboard.gen.tsx';
	import { generatePassword } from '#lib/pwdhash/Password.gen.tsx';
	import { onDestroy } from 'svelte';

	let domainInput = $state('');
	let sourcePassword = $state('');
	let confirmationInput = $state('');
	let generation = $state<ReturnType<typeof generatePassword> | null>(null);
	let hasRequestedGeneration = $state(false);
	let isGeneratedPasswordFocused = $state(false);
	let copyFeedback = $state<'idle' | 'copied' | 'failed'>('idle');
	let generationTimer: number | undefined;
	let copyAttempt = 0;

	let generatedPassword = $derived(generation?.TAG === 'Ok' ? generation._0 : '');
	let generatedPasswordDisplay = $derived(
		isGeneratedPasswordFocused || generatedPassword === ''
			? generatedPassword
			: `${generatedPassword.slice(0, 2)}${'*'.repeat(Math.max(generatedPassword.length - 2, 0))}`
	);
	let currentConfirmationClass = $derived(
		sourcePassword === '' ? 'neutral' : confirmationClass(sourcePassword, confirmationInput)
	);
	let confirmationMessage = $derived(
		currentConfirmationClass === 'matching-prefix'
			? 'Passwords match so far.'
			: currentConfirmationClass === 'exact-match'
				? 'Passwords match.'
				: currentConfirmationClass === 'mismatch'
					? 'Passwords do not match.'
					: ''
	);
	let domainError = $derived(
		hasRequestedGeneration && generation?.TAG === 'Error'
			? generation._0 === 'MissingDomain'
				? 'Enter a domain.'
				: 'Enter a valid domain.'
			: ''
	);

	function scheduleGeneration() {
		if (generationTimer !== undefined) {
			window.clearTimeout(generationTimer);
		}

		copyAttempt += 1;
		copyFeedback = 'idle';

		if (sourcePassword === '') {
			generation = null;
			return;
		}

		const nextDomain = domainInput;
		const nextPassword = sourcePassword;
		generationTimer = window.setTimeout(() => {
			generation = generatePassword(nextDomain, nextPassword);
			generationTimer = undefined;
		}, 200);
	}

	function updateDomain(value: string) {
		domainInput = value;
		scheduleGeneration();
	}

	function updateSourcePassword(value: string) {
		sourcePassword = value;
		if (value !== '') {
			hasRequestedGeneration = true;
		}
		scheduleGeneration();
	}

	async function copyGeneratedPassword() {
		hasRequestedGeneration = true;
		copyAttempt += 1;
		const activeCopyAttempt = copyAttempt;
		if (generationTimer !== undefined) {
			window.clearTimeout(generationTimer);
			generationTimer = undefined;
		}
		generation = generatePassword(domainInput, sourcePassword);

		if (generation.TAG === 'Error') {
			return;
		}

		const result = await copyToClipboard(
			(text) => navigator.clipboard.writeText(text),
			generation._0
		);
		if (activeCopyAttempt === copyAttempt) {
			copyFeedback = result.TAG === 'Ok' ? 'copied' : 'failed';
		}
	}

	onDestroy(() => {
		if (generationTimer !== undefined) {
			window.clearTimeout(generationTimer);
		}
	});
</script>

<svelte:head>
	<title>Password Generator</title>
</svelte:head>

<main>
	<h1>Password Generator</h1>

	<form onsubmit={(event) => event.preventDefault()}>
		<div class="field">
			<label for="domain">Domain</label>
			<input
				id="domain"
				name="domain"
				type="text"
				autocomplete="url"
				aria-invalid={domainError === '' ? undefined : true}
				aria-describedby={domainError === '' ? undefined : 'domain-error'}
				value={domainInput}
				oninput={(event) => updateDomain(event.currentTarget.value)}
			/>
			{#if domainError}
				<p id="domain-error" class="error" role="alert">{domainError}</p>
			{/if}
		</div>

		<div class="field">
			<label for="source-password">Password</label>
			<input
				id="source-password"
				name="source-password"
				type="password"
				autocomplete="current-password"
				value={sourcePassword}
				oninput={(event) => updateSourcePassword(event.currentTarget.value)}
			/>
		</div>

		<div class="field">
			<label for="confirmation">Confirm Password <span>(Optional)</span></label>
			<input
				id="confirmation"
				name="confirmation"
				type="password"
				autocomplete="off"
				class={currentConfirmationClass}
				bind:value={confirmationInput}
			/>
			<p class="confirmation-status" aria-live="polite">{confirmationMessage}</p>
		</div>

		<div class="field">
			<label for="generated-password">Hashed Password</label>
			<input
				id="generated-password"
				name="generated-password"
				type="text"
				readonly
				autocomplete="off"
				value={generatedPasswordDisplay}
				aria-label="Generated password. Focus to reveal the full value."
				onfocus={() => (isGeneratedPasswordFocused = true)}
				onblur={() => (isGeneratedPasswordFocused = false)}
			/>
		</div>

		<div class="actions">
			<button type="button" onclick={copyGeneratedPassword}>Copy</button>
			<p class="copy-feedback" aria-live="polite">
				{#if copyFeedback === 'copied'}
					Copied.
				{:else if copyFeedback === 'failed'}
					Copy failed. Use the generated-password field instead.
				{/if}
			</p>
		</div>
	</form>
</main>

<style>
	main {
		max-width: 32rem;
		margin: 3rem auto;
		padding: 0 1rem;
	}

	form,
	.field {
		display: grid;
		gap: 0.5rem;
	}

	form {
		gap: 1rem;
	}

	input,
	button {
		font: inherit;
	}

	input {
		padding: 0.5rem;
	}

	label span {
		font-style: italic;
		font-weight: normal;
	}

	.matching-prefix {
		background: #fff7cc;
	}

	.exact-match {
		background: #ddf7df;
	}

	.mismatch,
	input[aria-invalid='true'] {
		background: #ffe1e6;
	}

	.error {
		margin: 0;
		color: #a40022;
	}

	.actions {
		display: flex;
		align-items: baseline;
		gap: 1rem;
	}

	.copy-feedback {
		min-height: 1.5rem;
		margin: 0;
	}

	.confirmation-status {
		min-height: 1.5rem;
		margin: 0;
	}
</style>
