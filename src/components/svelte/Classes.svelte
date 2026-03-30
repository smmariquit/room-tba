<script lang="ts">
  import type { ClassMapValue } from "../../lib/types";

  interface Props {
    classes: ClassMapValue[];
  }
  const { classes }: Props = $props();
</script>

<div class="class-list">
  {#each classes as { courseCode, courseTitle, section, type, schedule }}
    <div class="class-item">
      <div class="class-info">
        <div class="class-code">{courseCode} ({type})</div>
        <div class="class-title">{courseTitle}</div>
        <div class="class-section">{section}</div>
      </div>
      <div class="class-schedule">
        {#each schedule.split(",") as sched}
          <div>{sched}</div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .class-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0.5rem 0;
  }

  .class-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 12px;
    background: hsl(0, 0%, 95%);
    border-radius: 3px;
    font-size: 14px;
    flex: 1 0 300px;
    border: 1px solid transparent;
    transition:
      border 0.15s,
      background-color 0.1s;
  }
  .class-info {
    flex: 1;
  }

  .class-code {
    font-weight: 500;
  }

  .class-title {
    color: #666;
    font-size: 13px;
    margin-top: 2px;
  }

  .class-section {
    color: #888;
    font-size: 12px;
  }

  .class-schedule {
    text-align: right;
    font-size: 13px;
    color: #444;
    white-space: nowrap;
  }
</style>
