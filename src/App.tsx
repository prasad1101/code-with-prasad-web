import { LazyMotion, MotionConfig } from 'framer-motion'
import { lazy, useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { useSite } from './hooks/useContent'
// Home is the landing page, so it ships in the entry chunk instead of a second round trip.
import Home from './pages/Home'
import { applyTheme, hasStoredTheme } from './hooks/useTheme'

const loadMotionFeatures = () => import('./lib/motionFeatures').then((m) => m.default)

const BlogList = lazy(() => import('./pages/BlogList'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const Tutorials = lazy(() => import('./pages/Tutorials'))
const TutorialOverview = lazy(() => import('./pages/TutorialOverview'))
const TutorialLesson = lazy(() => import('./pages/TutorialLesson'))
const Projects = lazy(() => import('./pages/Projects'))
const NotFound = lazy(() => import('./pages/NotFound'))

/** site.json's `meta.themeDefault` applies only when the visitor has no saved or OS preference. */
function useDefaultTheme() {
  const { data } = useSite()
  const theme = data?.meta.themeDefault
  useEffect(() => {
    if (!theme || hasStoredTheme()) return
    const osHasPreference =
      matchMedia('(prefers-color-scheme: light)').matches ||
      matchMedia('(prefers-color-scheme: dark)').matches
    if (!osHasPreference) applyTheme(theme, false)
  }, [theme])
}

export default function App() {
  useDefaultTheme()
  return (
    <HelmetProvider>
      {/* Animation features load after first paint; `strict` forbids the heavy `motion.*` API. */}
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="blog" element={<BlogList />} />
                <Route path="blog/:slug" element={<BlogPost />} />
                <Route path="tutorials" element={<Tutorials />} />
                <Route path="tutorials/:slug" element={<TutorialOverview />} />
                <Route path="tutorials/:slug/:lesson" element={<TutorialLesson />} />
                <Route path="projects" element={<Projects />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </HashRouter>
        </MotionConfig>
      </LazyMotion>
    </HelmetProvider>
  )
}
