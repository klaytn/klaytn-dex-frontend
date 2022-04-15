<template>
  <div class="token-input">
    <div class="token-value">
      <input placeholder="0.123" type="text">
      <button>MAX</button>
      <div class="select">
      </div>
    </div>
    <div class="token-meta">
      <span class="price">$142.57</span>
      <div class="row">
        <span class="price">Balace: 0.05754</span>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.00317 4.88281C6.24536 4.88281 6.44458 4.80469 6.60083 4.64844C6.76489 4.49219 6.84692 4.29688 6.84692 4.0625C6.84692 3.82031 6.76489 3.62109 6.60083 3.46484C6.44458 3.30859 6.24536 3.23047 6.00317 3.23047C5.7688 3.23047 5.56958 3.30859 5.40552 3.46484C5.24927 3.62109 5.17114 3.82031 5.17114 4.0625C5.17114 4.28906 5.25317 4.48438 5.41724 4.64844C5.58911 4.80469 5.78442 4.88281 6.00317 4.88281ZM0.00317383 6.5C0.00317383 5.41406 0.272705 4.41406 0.811768 3.5C1.35083 2.57812 2.0813 1.84766 3.00317 1.30859C3.92505 0.769531 4.92505 0.5 6.00317 0.5C7.09692 0.5 8.10083 0.769531 9.01489 1.30859C9.93677 1.84766 10.6633 2.57812 11.1946 3.5C11.7336 4.41406 12.0032 5.41406 12.0032 6.5C12.0032 7.58594 11.7336 8.58984 11.1946 9.51172C10.6633 10.4258 9.93677 11.1523 9.01489 11.6914C8.10083 12.2305 7.09692 12.5 6.00317 12.5C4.92505 12.5 3.92505 12.2305 3.00317 11.6914C2.0813 11.1523 1.35083 10.4258 0.811768 9.51172C0.272705 8.58984 0.00317383 7.58594 0.00317383 6.5ZM5.33521 9.11328C5.33521 9.29297 5.40552 9.45312 5.54614 9.59375C5.68677 9.72656 5.85474 9.80078 6.05005 9.81641C6.24536 9.81641 6.41333 9.75 6.55396 9.61719C6.69458 9.47656 6.76489 9.30859 6.76489 9.11328V6.34766C6.76489 6.14453 6.69458 5.97656 6.55396 5.84375C6.42114 5.70312 6.25317 5.63281 6.05005 5.63281C5.85474 5.63281 5.68677 5.70312 5.54614 5.84375C5.40552 5.97656 5.33521 6.14453 5.33521 6.34766V9.11328Z"
            fill="#BFC9DC"/>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.token {

  &-input {
    background: $gray3;
    padding: 16px 16px;
    border-radius: 8px;
  }

  &-value {
    display: flex;
    align-items: center;

    & input {
      font-style: normal;
      font-weight: 600;
      font-size: 30px;
      line-height: 130%;
      color: $dark2;
      background: transparent;
      border: none;
      max-width: 212px;
      width: 100%;
    }

    & button {
      font-weight: 700;
      font-size: 10px;
      line-height: 16px;
      background: $blue;
      border-radius: 8px;
      color: $white;
      padding: 4px 8px;
      margin-left: 8px;
    }

    & .select {
      width: 88px;
      height: 40px;
      background: $white;
      border-radius: 8px;
      box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.07);
      margin-left: 8px;
    }
  }

  &-meta {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    & .price {
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 15px;
      color: $gray4;
    }
  }
}

</style>
