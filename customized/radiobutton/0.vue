<style scoped>
  .tabs {
    display: flex;
    gap: 8px;
  }

  .tab-group input {
    appearance: none;
  }

  .tab-group label {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    line-height: 1.6;
    border: 1px solid #cccccc;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 700;
    position: relative;
    background-color: transparent;
    transition: all 0.48s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .tab-group label::after {
    content: "";
    position: absolute;
    bottom: -32px;
    left: 50%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #0a3cff;
    transform: translateX(-50%);
    transform-origin: 0 0;
    scale: 0;
    opacity: 0;
    z-index: -1;
    transition: all 0.48s 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .tab-group label::before {
    content: "";
    position: absolute;
    top: -24px;
    left: 50%;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: #0a3cff;
    transform: translate(-50%, -50%);
    z-index: -1;
    opacity: 0;
    scale: 0;
    transform-origin: 0 0;
    transition: all 0.48s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .tab-group label:hover {
    border-color: #0a3cff;
    color: #0a3cff;
  }

  .tab-group input:checked + label {
    border-color: transparent;
    color: #ffffff;
    scale: 1.1;
  }

  .tab-group input:checked + label::after {
    bottom: -16px;
    opacity: 1;
    scale: 1;
    box-shadow:
      0rem 6px 13px rgba(10, 60, 255, 0.1),
      0rem 24px 24px rgba(10, 60, 255, 0.09),
      0rem 55px 33px rgba(10, 60, 255, 0.05),
      0rem 97px 39px rgba(10, 60, 255, 0.01),
      0rem 152px 43px rgba(10, 60, 255, 0);
  }

  .tab-group input:checked + label::before {
    opacity: 1;
    scale: 1;
    top: 50%;
    box-shadow:
      0rem 6px 13px rgba(10, 60, 255, 0.1),
      0rem 24px 24px rgba(10, 60, 255, 0.09),
      0rem 55px 33px rgba(10, 60, 255, 0.05),
      0rem 97px 39px rgba(10, 60, 255, 0.01),
      0rem 152px 43px rgba(10, 60, 255, 0);
  }
</style>

<template>
  <div class="tabs">
    <div class="tab-group">
      <input checked="" id="tab1" name="tab" value="1" type="radio" />
      <label for="tab1">
        <span>1</span>
      </label>
    </div>
    <div class="tab-group">
      <input id="tab2" name="tab" value="2" type="radio" />
      <label for="tab2">
        <span>2</span>
      </label>
    </div>
    <div class="tab-group">
      <input id="tab3" name="tab" value="3" type="radio" />
      <label for="tab3">
        <span>3</span>
      </label>
    </div>
  </div>
</template>
