import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  RocketIcon,
  UpdateIcon,
  StarFilledIcon,
  CodeIcon,
  CheckCircledIcon,
  DownloadIcon,
  MobileIcon,
} from '@radix-ui/react-icons';

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const features = [
    {
      icon: RocketIcon,
      title: 'OTA Updates',
      description:
        'Deploy JavaScript, HTML, and CSS updates instantly without app store approval. Delta updates, rollback protection, and multiple channels included.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: MobileIcon,
      title: 'Native App Updates',
      description:
        'Check and prompt for app store updates with flexible or immediate strategies. Direct users to the right store automatically.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: StarFilledIcon,
      title: 'In-App Reviews',
      description:
        'Request user reviews at the perfect moment without leaving your app. Smart rate limiting and platform-specific implementations.',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Install the Plugin',
      description: 'Add native-update to your Capacitor project with a single command.',
      icon: DownloadIcon,
    },
    {
      number: '02',
      title: 'Configure Your Backend',
      description: 'Use our Node.js or Firebase examples, or build your own endpoint.',
      icon: CodeIcon,
    },
    {
      number: '03',
      title: 'Initialize in Your App',
      description: 'Configure the plugin with your server URL and preferences.',
      icon: UpdateIcon,
    },
    {
      number: '04',
      title: 'Deploy Updates',
      description: 'Push OTA updates, manage app versions, and request reviews seamlessly.',
      icon: CheckCircledIcon,
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-accent-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(2,132,199,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(192,38,211,0.1),transparent_50%)]" />
      </div>

      {/* Floating Geometric Shapes */}
      <motion.div
        className="pointer-events-none absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-gradient-to-br from-brand-400/20 to-brand-600/20 blur-3xl"
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="pointer-events-none absolute right-[15%] top-[60%] h-96 w-96 rounded-full bg-gradient-to-br from-accent-400/20 to-accent-600/20 blur-3xl"
        animate={{
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <Container>
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              <RocketIcon className="h-4 w-4" />
              The Complete Update Solution for Capacitor
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="mb-6 font-display text-6xl font-extrabold leading-tight tracking-tight sm:text-7xl lg:text-8xl"
            >
              <span className="bg-gradient-to-r from-brand-600 via-accent-600 to-brand-600 bg-clip-text text-transparent">
                Ship Updates
              </span>
              <br />
              <span className="text-gray-900">Instantly.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mb-10 text-xl text-gray-600 sm:text-2xl"
            >
              Deploy OTA updates, manage app versions, and request reviews - all with one powerful plugin.
              <br />
              <span className="font-semibold text-gray-900">No app store waiting. No user friction.</span>
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link to="/contact">
                <Button size="xl" variant="primary" className="group relative overflow-hidden">
                  <span className="relative z-10">Get Started Free</span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-accent-600 to-brand-600"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </Button>
              </Link>
              <Link to="/docs">
                <Button size="xl" variant="outline">
                  <CodeIcon className="mr-2 h-5 w-5" />
                  View Documentation
                </Button>
              </Link>
            </motion.div>

            {/* Floating Code Preview */}
            <motion.div
              variants={itemVariants}
              className="mt-16"
            >
              <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-2xl">
                <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-800 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-gray-400">App.tsx</span>
                </div>
                <div className="p-6 font-mono text-sm">
                  <div className="text-purple-400">
                    <span className="text-blue-400">await</span>{' '}
                    <span className="text-yellow-300">NativeUpdate</span>
                    <span className="text-white">.</span>
                    <span className="text-green-400">configure</span>
                    <span className="text-white">{'({'}</span>
                  </div>
                  <div className="ml-4 text-gray-300">
                    <span className="text-blue-300">serverUrl</span>
                    <span className="text-white">: </span>
                    <span className="text-orange-400">'https://your-api.com'</span>
                    <span className="text-white">,</span>
                  </div>
                  <div className="ml-4 text-gray-300">
                    <span className="text-blue-300">autoCheck</span>
                    <span className="text-white">: </span>
                    <span className="text-orange-400">true</span>
                    <span className="text-white">,</span>
                  </div>
                  <div className="text-white">{'});'}</div>
                  <div className="mt-4 text-gray-500">// Updates deployed ✨</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
            className="text-center"
          >
            <motion.h2
              variants={itemVariants}
              className="mb-4 font-display text-5xl font-bold text-gray-900"
            >
              Everything You Need
            </motion.h2>
            <motion.p variants={itemVariants} className="mb-16 text-xl text-gray-600">
              Three powerful features. One simple API.
            </motion.p>

            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="group relative h-full overflow-hidden border-2 transition-all hover:border-transparent hover:shadow-2xl">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-10`} />
                    <CardHeader>
                      <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 bg-gray-50">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
          >
            <motion.h2
              variants={itemVariants}
              className="mb-4 text-center font-display text-5xl font-bold text-gray-900"
            >
              How It Works
            </motion.h2>
            <motion.p variants={itemVariants} className="mb-16 text-center text-xl text-gray-600">
              Get started in minutes, not hours.
            </motion.p>

            <div className="relative mx-auto max-w-3xl">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-600 to-accent-600 sm:left-1/2" />

              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={itemVariants}
                  className={`relative mb-12 flex items-start gap-6 ${
                    index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="absolute left-8 -translate-x-1/2 sm:left-1/2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-600 shadow-lg">
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>

                  {/* Content card */}
                  <div className={`ml-24 flex-1 sm:ml-0 ${index % 2 === 0 ? 'sm:pr-24' : 'sm:pl-24 sm:text-right'}`}>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                      <div className="mb-2 font-mono text-sm font-bold text-brand-600">
                        {step.number}
                      </div>
                      <h3 className="mb-2 text-2xl font-bold text-gray-900">{step.title}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-accent-600 to-brand-700" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />

        <Container className="relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="mx-auto max-w-3xl text-center text-white"
          >
            <motion.h2
              variants={itemVariants}
              className="mb-6 font-display text-5xl font-bold sm:text-6xl"
            >
              Ready to Ship Faster?
            </motion.h2>
            <motion.p variants={itemVariants} className="mb-10 text-xl opacity-90">
              Join developers who are deploying updates instantly with Native Update.
              <br />
              Start for free. No credit card required.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/contact">
                <Button
                  size="xl"
                  className="bg-white text-brand-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all"
                >
                  <RocketIcon className="mr-2 h-5 w-5" />
                  Get Started Now
                </Button>
              </Link>
              <Link to="/examples">
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                >
                  View Examples
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-12 flex items-center justify-center gap-8 text-sm opacity-75">
              <div className="flex items-center gap-2">
                <CheckCircledIcon className="h-5 w-5" />
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircledIcon className="h-5 w-5" />
                <span>Type Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircledIcon className="h-5 w-5" />
                <span>Well Documented</span>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}
