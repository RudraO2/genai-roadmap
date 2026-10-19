import type { ReactNode } from 'react'

export function CourseIcon({ id }: { id: string }): ReactNode {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {id === 'explorer' ? <><circle cx="24" cy="24" r="17" /><path d="m31 17-4 10-10 4 4-10z" /><path d="M24 3v4m0 34v4M3 24h4m34 0h4" /></> :
      id === 'engineer' ? <><rect x="5" y="9" width="38" height="30" rx="5" /><path d="m18 19-5 5 5 5m12-10 5 5-5 5m-4-13-4 16" /></> :
      id === 'builder' ? <><path d="m24 5 20 10-20 10L4 15zM4 24l20 10 20-10M4 33l20 10 20-10" /></> :
        <><path d="m24 5 5 14 14 5-14 5-5 14-5-14-14-5 14-5zM39 4v8m-4-4h8" /></>}
  </svg>
}
export const COURSE_COPY: Record<string, { title: string; description: string; audience: string }> = {
  explorer: { title: 'Use AI in everyday life', description: 'Get better answers, spot mistakes, and make everyday tasks a little easier.', audience: 'No coding or AI experience needed' },
  engineer: { title: 'Build your own AI apps', description: 'Go from writing Python to building an AI app that other people can use.', audience: 'For people ready to learn some code' },
  builder: { title: 'Understand how AI works', description: 'Explore the ideas behind AI, then learn to build and train a model yourself.', audience: 'For learners comfortable with code and maths' },
  creator: { title: 'Make something with AI', description: 'Bring an idea to life with images, video, or voice. Build a creative process of your own.', audience: 'For curious makers, no coding needed to start' },
}
