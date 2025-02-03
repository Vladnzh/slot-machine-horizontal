import { defineConfig } from 'vite'

export default defineConfig({
    // Если нужно указать дополнительные алиасы или параметры,
    // их можно добавить здесь
    resolve: {
        alias: {
            // Например, можно создать алиас для src:
            '@': '/src'
        }
    }
})