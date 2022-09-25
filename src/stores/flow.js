import { defineStore } from "pinia";
import { ref } from "vue";
const useFlowChartStore = defineStore("flow", () => {
  const flowChartList = ref([]);

  const setFlowChartList = (newFlowChartList) => {
    flowChartList.value = newFlowChartList;
  };

  const jslumbSortData = ref([]);

  const updateSortData = (name) => {
    //拿到数据就插入，假如大家要做一些插入的时候，判断是否重复就可以在这里做
    jslumbSortData.value.unshift(name);
  };

  return {
    flowChartList,
    jslumbSortData,
    setFlowChartList,
    updateSortData,
  };
});

export default useFlowChartStore;
