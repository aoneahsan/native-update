import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  RocketIcon,
  UpdateIcon,
  StarFilledIcon,
  LockClosedIcon,
  LightningBoltIcon,
  CheckCircledIcon,
  LayersIcon,
  ReloadIcon,
  BarChartIcon,
} from '@radix-ui/react-icons';

export default function FeaturesPage() {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const otaFeatures = [
    {
      icon: LightningBoltIcon,
      title: 'Instant Deployment',
      description: 'Push JavaScript, HTML, and CSS updates to users instantly without waiting for app store approval.',
    },
    {
      icon: LayersIcon,
      title: 'Delta Updates',
      description: 'Only download changed files to minimize bandwidth usage and speed up update delivery.',
    },
    {
      icon: ReloadIcon,
      title: 'Automatic Rollback',
      description: 'Built-in rollback protection automatically reverts failed updates to keep your app stable.',
    },
    {
      icon: CheckCircledIcon,
      title: 'Update Channels',
      description: 'Manage multiple update channels (production, staging, beta) for controlled rollouts.',
    },
    {
      icon: LockClosedIcon,
      title: 'End-to-End Encryption',
      description: 'Secure bundle downloads with signature verification and checksum validation.',
    },
    {
      icon: BarChartIcon,
      title: 'Update Analytics',
      description: 'Track update success rates, download progress, and user adoption metrics.',
    },
  ];

  const nativeFeatures = [
    {
      icon: UpdateIcon,
      title: 'Version Checking',
      description: 'Automatically check for new app versions available in App Store or Play Store.',
    },
    {
      icon: CheckCircledIcon,
      title: 'Flexible Updates',
      description: 'Choose between immediate (blocking) or flexible (background) update strategies.',
    },
    {
      icon: LightningBoltIcon,
      title: 'Priority Levels',
      description: 'Define update priority to control when and how aggressively to prompt users.',
    },
    {
      icon: RocketIcon,
      title: 'Direct Store Links',
      description: 'Automatically navigate users to the correct app store for their platform.',
    },
  ];

  const reviewFeatures = [
    {
      icon: StarFilledIcon,
      title: 'In-App Prompts',
      description: 'Request reviews without forcing users to leave your app using native APIs.',
    },
    {
      icon: CheckCircledIcon,
      title: 'Smart Timing',
      description: 'Trigger review requests at optimal moments based on user engagement.',
    },
    {
      icon: LockClosedIcon,
      title: 'Rate Limiting',
      description: 'Built-in throttling prevents review spam and respects platform guidelines.',
    },
    {
      icon: LayersIcon,
      title: 'Platform-Specific',
      description: 'Uses StoreKit for iOS and Play Core for Android for native experiences.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-accent-600 to-brand-700 py-24 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        <Container className="relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.h1
              variants={itemVariants}
              className="mb-6 font-display text-6xl font-bold"
            >
              Complete Update Solution
            </motion.h1>
            <motion.p variants={itemVariants} className="text-xl opacity-90">
              Everything you need to keep your Capacitor app up-to-date and users engaged.
            </motion.p>
          </motion.div>
        </Container>
      </section>

      {/* OTA Updates Features */}
      <section className="py-24">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <div className="mb-16 text-center">
              <motion.div
                variants={itemVariants}
                className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg"
              >
                <RocketIcon className="h-8 w-8 text-white" />
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className="mb-4 font-display text-4xl font-bold text-gray-900"
              >
                OTA Updates
              </motion.h2>
              <motion.p variants={itemVariants} className="text-xl text-gray-600">
                Deploy code updates instantly without app store delays
              </motion.p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otaFeatures.map((feature) => (
                <motion.div key={feature.title} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
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

      {/* Native App Updates Features */}
      <section className="bg-gray-50 py-24">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <div className="mb-16 text-center">
              <motion.div
                variants={itemVariants}
                className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"
              >
                <UpdateIcon className="h-8 w-8 text-white" />
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className="mb-4 font-display text-4xl font-bold text-gray-900"
              >
                Native App Updates
              </motion.h2>
              <motion.p variants={itemVariants} className="text-xl text-gray-600">
                Guide users to install new app versions from the store
              </motion.p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {nativeFeatures.map((feature) => (
                <motion.div key={feature.title} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
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

      {/* In-App Reviews Features */}
      <section className="py-24">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <div className="mb-16 text-center">
              <motion.div
                variants={itemVariants}
                className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg"
              >
                <StarFilledIcon className="h-8 w-8 text-white" />
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className="mb-4 font-display text-4xl font-bold text-gray-900"
              >
                In-App Reviews
              </motion.h2>
              <motion.p variants={itemVariants} className="text-xl text-gray-600">
                Collect user feedback without leaving your app
              </motion.p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {reviewFeatures.map((feature) => (
                <motion.div key={feature.title} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
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
    </div>
  );
}
