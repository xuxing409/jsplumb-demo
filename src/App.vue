<template>
  <el-container>
    <el-header class="header">Header</el-header>
    <el-container>
      <el-aside style="background-color: yellow" width="200px">Aside</el-aside>
      <el-container>
        <el-main class="main">
          <flow />
        </el-main>
        <el-footer style="background-color: #b7ff00">Footer</el-footer>
      </el-container>
    </el-container>
  </el-container>
</template>

<script setup>
import Flow from "./views/flow/index.vue";
</script>

<style lang="scss" scoped>
.header {
  background-color: green;
}
.main {
  background-color: #fff;
}
</style>
