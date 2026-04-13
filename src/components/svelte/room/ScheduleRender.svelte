<script lang="ts">
  import {
    getColorForCourse,
    parseScheduleTime,
    ScheduleRenderer,
  } from "../../../lib/schedule-renderer";
  import type { ClassMapValue } from "../../../lib/types";

  interface Props {
    roomCode: string;
    classes: ClassMapValue[];
  }
  const { roomCode, classes }: Props = $props();
  // svelte-ignore state_referenced_locally
  const canvasId = $derived(`schedule-${roomCode}`);
  const renderer = $derived(
    new ScheduleRenderer(canvasId, {
      width: 1000,
      height: 450,
    }),
  );
  $effect(() => {
    classes.forEach((sectionClass) => {
      const schedule: string[] = sectionClass.schedule.split(",");
      if (schedule.length === 0) return;
      schedule.forEach((schedStr) => {
        const parsed = parseScheduleTime(schedStr);
        if (!parsed) {
          return;
        }
        const color = getColorForCourse(sectionClass.courseCode);
        const label =
          sectionClass.courseCode +
          (sectionClass.type ? " (" + sectionClass.type + ")" : "");

        renderer.addCourse({
          day: parsed.days,
          time: parsed.time,
          courseCode: label,
          section: sectionClass.section,
          color,
        });
      });
    });
  });
</script>

<canvas id={canvasId}></canvas>

<style>
  canvas {
    width: 100%;
    height: auto;
  }
</style>
