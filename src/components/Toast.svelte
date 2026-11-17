<script>
  import { toastMsg } from '../stores/store.js';
</script>

<div id="toast" role="status" class:on={Boolean($toastMsg)}>
  {$toastMsg}
</div>
