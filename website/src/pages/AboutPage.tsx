import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { GitHubLogoIcon, LinkedInLogoIcon } from '@radix-ui/react-icons';

export default function AboutPage() {
  return (
    <div className="min-h-screen py-24">
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg mx-auto"
        >
          <h1 className="font-display text-5xl font-bold">About Native Update</h1>

          <p className="text-xl text-gray-600">
            Native Update is a comprehensive update solution for Capacitor applications,
            providing OTA updates, native app updates, and in-app reviews in one powerful plugin.
          </p>

          <h2>Why Native Update?</h2>
          <p>
            Building mobile apps with Capacitor is great, but managing updates can be challenging.
            Native Update solves this by providing three essential features in a single, well-designed plugin:
          </p>
          <ul>
            <li><strong>OTA Updates:</strong> Deploy code changes instantly without app store approval</li>
            <li><strong>Native Updates:</strong> Guide users to install new app store versions</li>
            <li><strong>In-App Reviews:</strong> Request user feedback at the perfect moment</li>
          </ul>

          <h2>Open Source</h2>
          <p>
            Native Update is completely free and open source under the MIT License.
            The source code is available on GitHub, and we welcome contributions from the community.
          </p>

          <h2>Built By</h2>
          <p>
            Native Update is developed and maintained by{' '}
            <a href="https://aoneahsan.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
              Ahsan Mahmood
            </a>
            , a full-stack developer passionate about creating tools that make developers' lives easier.
          </p>

          <div className="flex gap-4 not-prose">
            <a
              href="https://github.com/aoneahsan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-brand-600"
            >
              <GitHubLogoIcon className="h-5 w-5" />
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/aoneahsan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-700 hover:text-brand-600"
            >
              <LinkedInLogoIcon className="h-5 w-5" />
              LinkedIn
            </a>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
