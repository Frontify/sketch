export default function executeSafely(context, func) {
    try {
        func(context)
    } catch (e) {
        console.error(e);
    }
}
