
function formatTime(seconds) {
    if (seconds <= 0) return '00:00:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

console.log("Test 1 (0s):", formatTime(0));
console.log("Test 2 (60s):", formatTime(60));
console.log("Test 3 (3600s):", formatTime(3600));
console.log("Test 4 (3661s):", formatTime(3661));
console.log("Test 5 (500s):", formatTime(500));
