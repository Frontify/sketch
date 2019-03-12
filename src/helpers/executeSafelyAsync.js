export default async function executeSafelyAsync(context, func) {
    try {
        await func(context)
    } catch (e) {
        console.error(e);
    }
}

