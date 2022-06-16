<script>
export default {
  name: 'KlayLoader',
}
</script>

<template>
  <div class="loader" />
</template>

<style scoped lang="scss">
.loader {
  border: 6px solid $white;
  border-radius: 50%;
  border-top: 6px solid $blue;
  width: 40px;
  height: 40px;
  -webkit-animation: spin 2s linear infinite; /* Safari */
  animation: spin 2s linear infinite;
}

/* Safari */
@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
