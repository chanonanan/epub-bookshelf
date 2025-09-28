export const syncChannel = new BroadcastChannel('epub-bookshelf-sync');

syncChannel.onmessage = (e) => {
  // Example: log progress in all tabs
  if (e.data.type === 'progress') {
    console.log('Progress update', e.data.progress);
  }
};
