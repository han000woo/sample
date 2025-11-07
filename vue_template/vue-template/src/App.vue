<template>
  <div id="app-container">
    <header>
      <h1>스근한 Vue 게시판</h1>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
/* 전역 스타일 (scoped 아님) */
#app-container {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 20px;
}
header { text-align: center; margin-bottom: 20px; }
a { text-decoration: none; color: #42b983; }
a:hover { text-decoration: underline; }
button {
  padding: 8px 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover { background-color: #369a6e; }
</style>