export const copyToClipboard = function myFunction(value) {
  /* Create the text field */
  const copyText = document.createElement('input')
  copyText.focus()
  copyText.value = value
  /* Select the text field */
  copyText.select()
  copyText.setSelectionRange(0, 99999) /* For mobile devices */
  /* Copy the text inside the text field */
  navigator.clipboard.writeText(copyText.value)
}
