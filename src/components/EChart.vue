<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{ option: echarts.EChartsOption; height?: string }>()
const el = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!el.value) return
  chart = echarts.init(el.value)
  chart.setOption(props.option)
  // 容器尺寸变化（窗口缩放、侧边栏折叠、栅格变化）时自适应
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(el.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  chart?.dispose()
  chart = null
})
</script>
<template>
  <div ref="el" :style="{ height: height ?? '320px', width: '100%' }"></div>
</template>
