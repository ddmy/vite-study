<template>
    <h1>count: {{ count }}</h1>
    <button @click="add">增加</button>
</template>

<script>
export default {
  data() {
    return {
      count: 0,
      info: 'hi， vite!'
    }
  },
  methods: {
    add() {
      this.count++
    }
  }
}
</script>