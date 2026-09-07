<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { presentConfirmation } from '#lib/pwdhash/Confirmation.gen.tsx';
	import { copyToClipboard } from '#lib/pwdhash/Clipboard.gen.tsx';
	import { createBookmarkletHref, decodeBookmarkletHash } from '#lib/pwdhash/Bookmarklet.gen.tsx';
	import { presentForm } from '#lib/pwdhash/Form.gen.tsx';
	import { presentGeneratedPassword } from '#lib/pwdhash/GeneratedPassword.gen.tsx';

	let domainInput = $state('');
	let sourcePassword = $state('');
	let confirmationInput = $state('');
	let hasSubmitted = $state(false);
	let isGeneratedPasswordFocused = $state(false);
	let copyButtonLabel = $state('Copy');
	let copyAttempt = 0;
	let bookmarkletHref = $state('');
	let domainInputElement: HTMLInputElement;
	let passwordInputElement: HTMLInputElement;

	let form = $derived(presentForm(domainInput, sourcePassword, hasSubmitted));
	let generatedPassword = $derived(
		presentGeneratedPassword(form.generatedPassword, isGeneratedPasswordFocused)
	);
	let confirmation = $derived(presentConfirmation(sourcePassword, confirmationInput));

	function resetCopyButtonLabel() {
		copyAttempt += 1;
		copyButtonLabel = 'Copy';
	}

	async function copyGeneratedPassword() {
		hasSubmitted = true;
		resetCopyButtonLabel();
		const activeCopyAttempt = copyAttempt;
		if (form.generatedPassword === undefined) {
			return;
		}

		const result = await copyToClipboard(
			(text) => navigator.clipboard.writeText(text),
			form.generatedPassword
		);
		if (activeCopyAttempt === copyAttempt) {
			copyButtonLabel = result.TAG === 'Ok' ? 'Copied' : 'Copy failed - try again';
		}
	}

	onMount(() => {
		const generatorUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
		bookmarkletHref = createBookmarkletHref(generatorUrl);
		const initialAddress = decodeBookmarkletHash(window.location.hash.slice(1));
		domainInput = initialAddress;
		(initialAddress === '' ? domainInputElement : passwordInputElement).focus();
	});
</script>

<svelte:head>
	<title>PwdHash Generator</title>
</svelte:head>

<main>
	<h1>PwdHash Generator</h1>
	<p class="intro">Generates theft-resistant passwords.</p>

	<form
		onsubmit={(event) => {
			event.preventDefault();
			void copyGeneratedPassword();
		}}
	>
		<label>
			Site Address
			<input
				autocomplete="url"
				placeholder="https://example.com"
				aria-invalid={form.domainAriaInvalid}
				bind:value={domainInput}
				bind:this={domainInputElement}
				oninput={resetCopyButtonLabel}
			/>
			<small><span role={form.domainMessage.role}>{form.domainMessage.text}</span></small>
		</label>

		<label>
			Master Password
			<input
				type="password"
				autocomplete="current-password"
				aria-invalid={form.passwordAriaInvalid}
				bind:value={sourcePassword}
				bind:this={passwordInputElement}
				oninput={resetCopyButtonLabel}
			/>
			<small><span role={form.passwordMessage.role}>{form.passwordMessage.text}</span></small>
		</label>

		<label>
			Confirm Master Password <em>(Optional)</em>
			<input
				type="password"
				autocomplete="off"
				class={confirmation.className}
				aria-invalid={confirmation.ariaInvalid}
				bind:value={confirmationInput}
			/>
			<small aria-live="polite">{confirmation.message}</small>
		</label>

		<label>
			Generated Password
			<input
				readonly
				autocomplete="off"
				value={generatedPassword.value}
				onfocus={async (event) => {
					const input = event.currentTarget;
					isGeneratedPasswordFocused = true;
					await tick();
					input.select();
				}}
				onblur={() => (isGeneratedPasswordFocused = false)}
			/>
		</label>
		<button type="submit">{copyButtonLabel}</button>
	</form>

	<footer>
		<span class="bookmarklet">
			Bookmarklet: <a href={bookmarkletHref}>pH</a>
			<span class="bookmarklet-tooltip">Drag to your bookmarks bar.</span>
		</span>
		<a href="https://github.com/Leftium/pH">Source on GitHub</a>
	</footer>
</main>

<style>
	main {
		border: 1px solid var(--nc-border);
		border-radius: var(--nc-radius);
		padding: var(--nc-spacing);
	}

	h1 {
		text-align: center;
	}

	.intro {
		color: color-mix(in oklch, var(--nc-text), transparent 40%);
		text-align: center;
	}

	.matching-prefix {
		background: light-dark(#fff7cc, oklch(0.3 0.05 90));
	}

	input[aria-invalid='false'] {
		background: light-dark(#ddf7df, oklch(0.3 0.05 145));
	}

	input[aria-invalid='true'] {
		background: light-dark(#ffe1e6, oklch(0.3 0.05 25));
	}

	form small {
		min-height: 1.5rem;
	}

	form > button {
		width: 100%;
	}

	footer {
		margin-top: 2rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem 1rem;
	}

	.bookmarklet {
		position: relative;
	}

	.bookmarklet-tooltip {
		position: absolute;
		bottom: calc(100% + 0.5rem);
		left: 0;
		z-index: 1;
		width: max-content;
		max-width: min(18rem, calc(100vw - 3rem));
		padding: 0.35rem 0.5rem;
		border-radius: 0.25rem;
		background: #1f2937;
		color: white;
		font-size: 0.875rem;
		opacity: 0;
		pointer-events: none;
		transform: translateY(0.25rem);
		transition:
			opacity 0.1s,
			transform 0.1s;
	}

	.bookmarklet a:hover + .bookmarklet-tooltip,
	.bookmarklet:focus-within .bookmarklet-tooltip {
		opacity: 1;
		transform: translateY(0);
	}
</style>
