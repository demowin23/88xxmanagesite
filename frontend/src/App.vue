<template>
  <div id="app">
    <div class="navbar">
      <div class="container">
        <h1>🚀 Website Management</h1>
        <nav>
          <router-link to="/">📊 Dashboard</router-link>
          <router-link to="/websites">🌐 Websites</router-link>
          <router-link to="/teams">👥 Teams</router-link>
          <router-link to="/proxies">🔒 Proxies</router-link>
        </nav>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>



