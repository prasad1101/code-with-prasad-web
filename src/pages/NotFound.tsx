import { FiArrowLeft, FiBookOpen } from 'react-icons/fi'
import { Button } from '../components/ui/Button'
import { Seo } from '../components/ui/Seo'

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" />
      <section className="relative isolate grid min-h-[80dvh] place-items-center overflow-hidden px-4 pt-24 pb-16 text-center">
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <div className="grid-bg absolute inset-0" />
          <div className="blob top-[20%] left-[30%] size-[22rem] bg-violet-600/30" />
        </div>
        <div>
          <p className="text-accent-2 font-mono text-sm">
            <span aria-hidden="true">$ </span>cd ./this-page
          </p>
          <h1 className="text-gradient mt-4 text-8xl font-bold sm:text-9xl">404</h1>
          <p className="mt-4 text-xl font-semibold">This route returned undefined.</p>
          <p className="text-muted mx-auto mt-2 max-w-md">
            The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you
            back on track.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/">
              <FiArrowLeft aria-hidden="true" /> Back home
            </Button>
            <Button to="/blog" variant="secondary">
              <FiBookOpen aria-hidden="true" /> Read the blog
            </Button>
            <Button to="/tutorials" variant="secondary">
              Tutorials
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
