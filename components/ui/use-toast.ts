export function useToast() {
  return {
    toast: ({ title, description }: { title: string; description?: string; variant?: string }) => {
      alert(`${title}${description ? '\n' + description : ''}`)
    }
  }
}
