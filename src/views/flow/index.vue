<template>
  <div class="container">
    <!-- 左侧node栏 -->
    <div class="process-type-container">
      <!-- 标题 -->
      <div>工序类型</div>
      <div class="list" id="leftUl">
        <div class="item" v-for="(item, index) in nodeTypeList" :key="index">
          {{ item.name }}
        </div>
      </div>
    </div>

    <!-- 中间画布 -->
    <div id="flowWrap" ref="flowWrapRef" class="flow-continer">
      <!-- id  必填，jsplumb是通过id来寻找连接对象 -->
      <!-- left top 在画布的位置 -->
      <!--  @contextmenu.prevent="handleContextMenu" 右键菜单 -->
      <div id="flow">
        <div
          v-show="auxiliaryLine.isShowXLine"
          class="auxiliary-line-x"
          :style="{
            width: auxiliaryLinePos.width,
            top: auxiliaryLinePos.y + 'px',
            left: auxiliaryLinePos.offsetX + 'px',
          }"
        ></div>
        <div
          v-show="auxiliaryLine.isShowYLine"
          class="auxiliary-line-y"
          :style="{
            height: auxiliaryLinePos.height,
            left: auxiliaryLinePos.x + 'px',
            top: auxiliaryLinePos.offsetY + 'px',
          }"
        ></div>
        <div
          v-for="(item, index) in nodeList"
          :id="item.id"
          :key="item.id"
          :style="{
            color: item.color,
            left: item.x + 'px',
            top: item.y + 'px',
          }"
          class="item node-anchor"
          style="display: flex; justify-content: center; align-items: center"
          @contextmenu.prevent="handleContextMenu($event, item, index)"
        >
          <!--   4个连接点的位置，瞄点 -->
          <div class="node-anchor anchor-top" style="display: none"></div>
          <div class="node-anchor anchor-bottom" style="display: none"></div>
          <!-- <div class="node-anchor anchor-right"></div>
        <div class="node-anchor anchor-left"></div> -->
          <span> {{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- 右边设置 -->
    <div class="process-setting-container">工序设置</div>
  </div>
</template>
<script setup>
import { ref, onMounted, reactive, nextTick, toRefs, watch } from "vue";
import useFlowChartStore from "@/stores/flow";
import sortable from "sortablejs";
import panzoom from "panzoom";

import { $contextmenu } from "vue-contextmenu-next/index";
//引入jsplumb实例
import jsPlumb from "jsplumb";
//jsplumbp配置
import {
  jsplumbSetting, // 通用画布、节点、锚点、连线配置
  jsplumbConnectOptions, // jsplumb连接参数
  jsplumbSourceOptions, //开始瞄点
  jsplumbTargetOptions, //结束瞄点
} from "@/utils/commonConfig.js";
import { GenNonDuplicateID } from "@/utils/utils.js";
import { storeToRefs } from "pinia";

let $jsPlumb = jsPlumb.jsPlumb;
// 缓存实例化的jsplumb对象
let jsPlumb_instance = null;

let data = reactive({
  jsplumbSettingConfig: jsplumbSetting, // 通用画布、节点、锚点、连线配置
  jsplumbConnectOptionsConfig: jsplumbConnectOptions, // jsplumb连接参数
  jsplumbSourceOptionsConfig: jsplumbSourceOptions, // 开始瞄点
  jsplumbTargetOptionsConfig: jsplumbTargetOptions, // 结束瞄点
  nodeList: [],
  lineList: [],
});

let {
  nodeList, //节点数据
  lineList, //连线数组
  jsplumbTargetOptionsConfig,
  jsplumbSourceOptionsConfig,
  jsplumbConnectOptionsConfig,
  jsplumbSettingConfig,
} = toRefs(data);

// console.log(
//   jsplumbSettingConfig,
//   jsplumbConnectOptionsConfig,
//   jsplumbSourceOptionsConfig,
//   jsplumbTargetOptionsConfig
// );

const nodeTypeList = ref([
  { name: "工序1", type: "node" },
  { name: "工序2", type: "node" },
  { name: "工序3", type: "node" },
  { name: "工序4", type: "node" },
  { name: "工序5", type: "node" },
]);

const auxiliaryLine = reactive({ isShowXLine: false, isShowYLine: false }); //对齐辅助线是否显示
const auxiliaryLinePos = reactive({
  width: "100%",
  height: "100%",
  offsetX: 0,
  offsetY: 0,
  x: 20,
  y: 20,
});

const { updateSortData } = useFlowChartStore();
onMounted(() => {
  /** 左侧列表拖拽初始化 */
  // 第一步，获取行容器
  let dome = document.getElementById("leftUl");
  let flowWrapDom = document.getElementById("flowWrap");
  // 第二步，初始化，给容器指定对应拖拽规则
  new sortable(dome, {
    animation: 150,
    sort: false, //关闭在盒内可以拖拽
    forceFallback: true, //忽略 HTML5拖拽行为，强制回调进行
    ghostClass: "blue-background-class", //drop placeholder的css类名
    //结束拖拽
    onEnd: function (evt) {
      //当元素移动的距离左侧小于309px的时候并且距离顶部的距离小于69px的时候，禁止插入
      // console.log(evt.originalEvent.x, dome.getBoundingClientRect().left);
      const scale = getScale();
      if (
        evt.originalEvent.x < flowWrapDom.getBoundingClientRect().left ||
        evt.originalEvent.x > flowWrapDom.getBoundingClientRect().right ||
        evt.originalEvent.y < flowWrapDom.getBoundingClientRect().top ||
        evt.originalEvent.y > flowWrapDom.getBoundingClientRect().bottom
      )
        return;

      let list = {
        id: setSessionid(), //生成随机Id
        x: evt.originalEvent.x - dome.getBoundingClientRect().right, //落下的位置(310是左侧列表整体的宽度)
        y: evt.originalEvent.y - dome.getBoundingClientRect().top, //落下的位置(70是头部的宽度)
      };
      // let left = (evt.originalEvent.x - containerRect.left - 60) / scale;
      // let top = (evt.originalEvent.y - containerRect.top - 20) / scale;
      // let list = {
      //   id: setSessionid(), //生成随机Id
      //   x: Math.round(top / 20) * 20 + "px", //落下的位置(310是左侧列表整体的宽度)
      //   y: Math.round(left / 20) * 20 + "px", //落下的位置(70是头部的宽度)
      // };

      //根据当前数据的下标拿到对应数据的，并和list合并
      Object.assign(list, nodeTypeList.value[evt.newIndex]);
      //并使用pinia来存储数据
      updateSortData(list);
    },
  });

  const getScale = () => {
    let scale1;
    if (jsPlumb_instance.pan) {
      const { scale } = jsPlumb_instance.pan.getTransform();
      scale1 = scale;
    } else {
      const matrix = window.getComputedStyle(
        jsPlumb_instance.getContainer()
      ).transform;
      scale1 = matrix.split(", ")[3] * 1;
    }
    jsPlumb_instance.setZoom(scale1);
    return scale1;
  };

  /** 中间画布初始化 */
  //jsplumb默认是注册在浏览器窗口的，将整个页面提供给我们作为一个实例，所以可以使用   getInstance方法建立页面中一个独立的实例：
  jsPlumb_instance = $jsPlumb.getInstance();
  nodeList.value = [
    {
      id: "Mfzcx4apkafHBYATbdz6hFYntSHsXtDz",
      x: 335,
      y: 103,
      type: "node",
      name: "工序1",
      color: "#5a9cf8",
    },
    {
      id: "sGsGhyhEJBsCSmRaAw8xJK3iaefcrKDX",
      x: 335,
      y: 79,
      type: "statr",
      name: "工序2",
      color: "#479A52",
    },
    {
      id: "sGsGhyhEJBsCSmRaAw8xJK3iaefcrKDl",
      x: 335,
      y: 150,
      type: "statr",
      name: "工序3",
      color: "#479A52",
    },
    {
      id: "sGsGhyhEJBsCSmRaAw8xJK3iaefcrKDl11",
      x: 335,
      y: 300,
      type: "statr",
      name: "工序4",
      color: "#479A52",
    },
  ];
  nextTick(() => {
    //因为jsplimb要在dom元素加载之后才能执行，因为他的原理是找到你绑定的画布dom去渲染svg数据，所以必须得画布dom已经渲染之后才能初始化
    init();
  });
});

//初始化
const init = () => {
  //ready监听jsplumb是否实例化，当jsplumb实例化执行ready内的方法，
  jsPlumb_instance.ready(() => {
    //给jsplumb设置一些默认值
    jsPlumb_instance.importDefaults(jsplumbSettingConfig.value);
    loadEasyFlow();

    //连线双击删除事件
    jsPlumb_instance.bind("dblclick", (conn, originalEvent) => {
      confirmDelLine(conn);
    });
    // 会使整个jsPlumb立即重绘。
    jsPlumb_instance.setSuspendDrawing(false, true);
  });

  initPanZoom();
};

const initPanZoom = () => {
  const mainContainer = jsPlumb_instance.getContainer();
  console.log(mainContainer);
  const mainContainerWrap = mainContainer.parentNode;
  const pan = panzoom(mainContainer, {
    smoothScroll: false,
    bounds: true,
    // autocenter: true,
    zoomDoubleClickSpeed: 1,
    minZoom: 0.5,
    maxZoom: 2,
    //设置滚动缩放的组合键，默认不需要组合键
    beforeWheel: (e) => {
      console.log(e);
      // let shouldIgnore = !e.ctrlKey
      // return shouldIgnore
    },
    beforeMouseDown: function (e) {
      // allow mouse-down panning only if altKey is down. Otherwise - ignore
      var shouldIgnore = e.ctrlKey;
      return shouldIgnore;
    },
  });
  jsPlumb_instance.mainContainerWrap = mainContainerWrap;
  jsPlumb_instance.pan = pan;
  // 缩放时设置jsPlumb的缩放比率
  pan.on("zoom", (e) => {
    const { x, y, scale } = e.getTransform();
    jsPlumb_instance.setZoom(scale);
    //根据缩放比例，缩放对齐辅助线长度和位置
    auxiliaryLinePos.width = (1 / scale) * 100 + "%";
    auxiliaryLinePos.height = (1 / scale) * 100 + "%";
    auxiliaryLinePos.offsetX = -(x / scale);
    auxiliaryLinePos.offsetY = -(y / scale);
  });
  pan.on("panend", (e) => {
    const { x, y, scale } = e.getTransform();
    auxiliaryLinePos.width = (1 / scale) * 100 + "%";
    auxiliaryLinePos.height = (1 / scale) * 100 + "%";
    auxiliaryLinePos.offsetX = -(x / scale);
    auxiliaryLinePos.offsetY = -(y / scale);
  });

  // 平移时设置鼠标样式
  mainContainerWrap.style.cursor = "grab";
  mainContainerWrap.addEventListener("mousedown", function wrapMousedown() {
    this.style.cursor = "grabbing";
    mainContainerWrap.addEventListener("mouseout", function wrapMouseout() {
      this.style.cursor = "grab";
    });
  });
  mainContainerWrap.addEventListener("mouseup", function wrapMouseup() {
    this.style.cursor = "grab";
  });
};

// 是否删除连线
const confirmDelLine = (line) => {
  ElMessageBox.confirm("确认删除该连线？", "删除连线", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then((res) => {
    jsPlumb_instance.deleteConnection(line);
  });
};

//加载流程图-初始化节点，使节点可以拖拽
const loadEasyFlow = () => {
  // 初始化节点
  for (let i = 0; i < nodeList.value.length; i++) {
    let node = nodeList.value[i];
    // 设置源点，可以拖出线连接其他节点
    jsPlumb_instance.makeSource(node.id, jsplumbSourceOptionsConfig.value);
    // 设置目标点，其他源点拖出的线可以连接该节点
    jsPlumb_instance.makeTarget(node.id, jsplumbTargetOptionsConfig.value);
    // this.jsPlumb.draggable(node.id);
    //画布节点添加拖拽方法
    draggableNode(node.id);

    jsPlumb_instance.unbind("connection"); //取消连接事件
    for (let i = 0; i < lineList.value.length; i++) {
      let line = this.data.lineList[i];
      jsPlumb_instance.connect(
        {
          source: line.from,
          target: line.to,
        },
        jsplumbConnectOptionsConfig.value
      );
    }
    //连线
    jsPlumb_instance.bind("connection", (evt) => {
      let from = evt.source.id;
      let to = evt.target.id;
      lineList.value.push({
        from: from,
        to: to,
        label: "", //连线名称
        id: GenNonDuplicateID(8),
        Remark: "",
      });
    });
  }
};

//给画布节点添加拖拽方法
const draggableNode = (nodeId) => {
  console.log(nodeId, "nodeId");
  jsPlumb_instance.draggable(nodeId, {
    grid: [5, 5],
    containment: "center",
    drag: (event) => {
      window.event
        ? (window.event.cancelBubble = true)
        : event.stopPropagation();
      return false;
    },
    stop: (event) => {
      auxiliaryLine.isShowXLine = false;
      auxiliaryLine.isShowYLine = false;
      let nodeIndex = nodeList.value.findIndex((x) => x.id === nodeId);
      Object.assign(nodeList.value[nodeIndex], {
        x: event.pos[0],
        y: event.pos[1],
      });
    },
  });
};

const { jslumbSortData } = storeToRefs(useFlowChartStore());

// 监听数据改变
watch(
  jslumbSortData,
  () => {
    if (jslumbSortData.value.length > 0) {
      let list = jslumbSortData.value[0];
      nodeList.value.push(list);

      //从左侧拖拽添加节点,添加新的节点后，要重绘画布
      nextTick(() => {
        jsPlumb_instance.makeSource(list.id, jsplumbSourceOptionsConfig.value);
        jsPlumb_instance.makeTarget(list.id, jsplumbConnectOptionsConfig.value);
        draggableNode(list.id);
      });
    }
  },
  {
    deep: true,
    immediate: true,
  }
);

//删除
const deleteBtn = (item, index) => {
  console.log(item, index);
  let isState = nodeList.value.some((x) => x.id === item.id);
  if (isState) {
    nodeList.value.splice(index, 1);
    jsPlumb_instance.remove(item.id);
    rightClick();
    return true;
  } else {
    return false;
  }
};

//生成随机id
const setSessionid = () => {
  var len = 32;
  var chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  var maxPos = chars.length;
  var pwd = "";
  for (var i = 0; i < len; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
};
//右键菜单
const handleContextMenu = ($event, item, index) => {
  $contextmenu({
    x: $event.x,
    y: $event.y,
    customLayoutClass: "customLayoutClass",
    menuList: [
      {
        text: "删除",
        icon: "DeleteFilled",
        onClick: () => {
          deleteBtn(item, index);
        },
      },
      {
        text: "复制",
        icon: "DocumentCopy",
        onClick: () => {},
      },
      {
        text: "多选删除",
        icon: "IceCream",
        onClick: () => {},
      },
      {
        text: "多选复制",
        icon: "Link",
        onClick: () => {},
      },
      {
        text: "多选拖拽",
        icon: "Location",
        onClick: () => {},
      },
    ],
  });
};

//右键菜单消失
const rightClick = () => {
  document.querySelectorAll(".customLayoutClass")[0].style.display = "none";
};
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
        user-select: none;
      }
    }
  }
  .flow-continer {
    flex: 1;
    /* background-color: #f2f2f2; */
    position: relative;

    overflow: hidden;
    background-image: url("../../assets/img/point.png");

    #flow {
      position: relative;
      width: 100%;
      height: 100%;
      .auxiliary-line-x {
        position: absolute;
        border: 0.5px dashed #2ab1e8;
        z-index: 9999;
      }
      .auxiliary-line-y {
        position: absolute;
        border: 0.5px dashed #2ab1e8;
        z-index: 9999;
      }
    }

    .item {
      position: absolute;
      text-align: center;
      padding: 5px 10px;
      border: 1px solid #eaeaea;
      width: 180px;
      height: 30px;
      font-size: 14px;
      cursor: pointer;
      background: white;
    }
  }
  .process-setting-container {
    width: 25%;
  }
}
</style>

<style lang="scss">
.customLayoutClass {
  width: 152px !important;
  .context-menu-item {
    font-size: 13px;
    height: 29px;
    padding: 0;
    .arrow {
      .icon {
        width: 0.7rem;
      }
    }
  }
}
.node-anchor {
  width: 10px;
  height: 10px;
  border: 1px solid red;
  z-index: 333;
}
.node-anchor:hover {
  .anchor-top,
  .anchor-bottom {
    display: block !important;
  }
}
.anchor-top {
  position: absolute;
  top: 0;
  left: 0;

  margin-left: 50%;
  margin-top: -5px;
  transform: translate(-50%, 0);

  width: 10px;
  height: 10px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: crosshair;

  background: -webkit-radial-gradient(#f4a460 10%, #fff 30%, #9a54ff 60%);
}
.anchor-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  border-radius: 50%;
  margin-left: 50%;
  margin-bottom: -5px;
  transform: translate(-50%, 0);

  width: 10px;
  height: 10px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: crosshair;

  background: -webkit-radial-gradient(#f4a460 10%, #fff 30%, #9a54ff 60%);
}
.anchor-right {
  position: absolute;
  right: 0;
  margin-right: -7px;
}
.anchor-left {
  position: absolute;
  left: 0;
  margin-left: -7px;
}
</style>
