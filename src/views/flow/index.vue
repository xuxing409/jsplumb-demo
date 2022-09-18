<template>
  <div class="container">
    <div class="process-type-container">
      <div>
        工序类型
        <el-button type="primary">button</el-button>
      </div>
      <div class="list">
        <div
          class="item"
          v-for="item in nodeTypeList"
          :key="item.id"
          draggable="true"
          @dragstart="drag($event, item)"
        >
          {{ item.type }}
        </div>
      </div>
    </div>
    <div
      id="flowWrap"
      ref="flowWrapRef"
      @drop="drop($event)"
      @dragover="allowDrop($event)"
      class="flow-continer"
    ></div>
    <div class="process-setting-container">工序设置</div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from "vue";
import jsPlumb from "jsplumb";

const nodeTypeList = ref([
  { id: 1, type: "工序1" },
  { id: 2, type: "工序2" },
  { id: 3, type: "工序3" },
  { id: 4, type: "工序4" },
  { id: 5, type: "工序5" },
]);

onMounted(() => {});
</script>

<style lang="scss" scoped>
.container {
  height: 100%;
  width: 100%;
  display: flex;
  .process-type-container {
    width: 25%;
    display: flex;
    flex-direction: column;
    .list {
      width: 100%;
      /* height: 100%; */
      display: flex;
      flex-wrap: wrap;

      .item {
        margin: 20px;
        background-color: #a2a2a2;
        width: 100px;
        height: 100px;
      }
    }
  }
  .flow-continer {
    flex: 1;
    background-color: #f2f2f2;
  }
  .process-setting-container {
    width: 25%;
  }
}
</style>
