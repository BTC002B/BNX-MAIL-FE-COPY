import Quill from 'quill';

if (Quill) {
  try {
    const Tooltip = Quill.import('ui/tooltip');
    if (Tooltip && !Tooltip.__boundsPatched) {
      Tooltip.__boundsPatched = true;
      const originalPosition = Tooltip.prototype.position;

      Tooltip.prototype.position = function (reference) {
        const shift = originalPosition.call(this, reference);

        if (this.quill && this.quill.container && this.root) {
          const containerRect = this.quill.container.getBoundingClientRect();
          const rootRect = this.root.getBoundingClientRect();
          const currentLeft = parseFloat(this.root.style.left) || 0;

          // Prevent tooltip from overflowing the left boundary of its container
          if (rootRect.left < containerRect.left + 10) {
            const diff = containerRect.left + 10 - rootRect.left;
            this.root.style.left = `${currentLeft + diff}px`;
          }

          // Prevent tooltip from overflowing the right boundary of its container
          const updatedRootRect = this.root.getBoundingClientRect();
          if (updatedRootRect.right > containerRect.right - 10) {
            const diff = updatedRootRect.right - (containerRect.right - 10);
            this.root.style.left = `${Math.max(10, currentLeft - diff)}px`;
          }
        }

        return shift;
      };
    }
  } catch (err) {
    console.error('Error applying Quill tooltip bounds patch:', err);
  }
}
