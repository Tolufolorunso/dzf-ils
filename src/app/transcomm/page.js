'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import StudentNav from '@/components/layout/StudentNav';
import styles from './transcomm.module.css';

export default function TranscommPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [apiArticles, setApiArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'drnicer-values', name: '🏆 DRNICER Values', icon: '🏆' },
    { id: 'leadership-basics', name: 'Leadership Basics', icon: '🌟' },
    { id: 'communication', name: 'Communication', icon: '💬' },
    { id: 'teamwork', name: 'Teamwork', icon: '🤝' },
    { id: 'problem-solving', name: 'Problem Solving', icon: '🧩' },
    { id: 'confidence', name: 'Building Confidence', icon: '💪' },
    { id: 'inspiration', name: 'Inspiration', icon: '✨' },
  ];

  const articles = [
    {
      id: 1,
      title: 'What Makes a Great Young Leader?',
      category: 'leadership-basics',
      readTime: '5 min read',
      excerpt:
        'Discover the key qualities that make young people effective leaders in their schools and communities.',
      content: `Leadership isn't about age - it's about attitude, actions, and the willingness to make a positive difference. As a young person, you have unique strengths that can make you an amazing leader.

**Key Qualities of Young Leaders:**
• **Curiosity** - Always asking questions and wanting to learn more
• **Empathy** - Understanding and caring about others' feelings
• **Courage** - Standing up for what's right, even when it's difficult
• **Creativity** - Finding new and innovative solutions to problems
• **Persistence** - Not giving up when things get tough

**Remember:** Every great leader started as a young person with big dreams. Your age is not a limitation - it's your superpower!`,
      tags: ['leadership', 'youth', 'qualities'],
    },
    {
      id: 2,
      title: 'How to Communicate Like a Leader',
      category: 'communication',
      readTime: '4 min read',
      excerpt:
        'Learn the art of clear, confident communication that inspires others to listen and follow.',
      content: `Great leaders are great communicators. Here's how you can develop your communication skills:

**Speaking with Confidence:**
• Speak clearly and at a good pace
• Make eye contact with your audience
• Use gestures to emphasize your points
• Practice your message beforehand

**Active Listening:**
• Give your full attention to the speaker
• Ask questions to show you're engaged
• Repeat back what you heard to confirm understanding
• Don't interrupt - let others finish their thoughts

**Written Communication:**
• Keep messages clear and simple
• Use proper grammar and spelling
• Be respectful in all your communications
• Think before you send - words have power!`,
      tags: ['communication', 'speaking', 'listening'],
    },
    {
      id: 3,
      title: 'Building Strong Teams at School',
      category: 'teamwork',
      readTime: '6 min read',
      excerpt:
        'Discover how to bring classmates together and create teams that achieve amazing things.',
      content: `Teamwork makes the dream work! Here's how to build and lead effective teams:

**Creating Team Unity:**
• Include everyone and value different perspectives
• Set clear goals that everyone understands
• Celebrate both individual and team achievements
• Create a safe space where everyone can contribute

**Resolving Team Conflicts:**
• Address issues early before they grow bigger
• Listen to all sides of the story
• Focus on solutions, not blame
• Help team members find common ground

**Motivating Your Team:**
• Recognize each person's unique strengths
• Give specific, positive feedback
• Share the vision and help others see the bigger picture
• Lead by example - show the behavior you want to see`,
      tags: ['teamwork', 'collaboration', 'school'],
    },
    {
      id: 4,
      title: 'Problem-Solving Like a Pro',
      category: 'problem-solving',
      readTime: '5 min read',
      excerpt:
        'Master the step-by-step approach to solving any challenge that comes your way.',
      content: `Every leader faces problems. What sets great leaders apart is how they approach and solve them:

**The Problem-Solving Process:**
1. **Identify the Real Problem** - What's really going on?
2. **Gather Information** - Get all the facts you need
3. **Brainstorm Solutions** - Think of multiple options
4. **Evaluate Options** - Consider pros and cons
5. **Choose and Act** - Pick the best solution and implement it
6. **Review Results** - Learn from what happened

**Creative Problem-Solving Tips:**
• Ask "What if?" questions
• Look at problems from different angles
• Don't be afraid to try new approaches
• Learn from mistakes - they're valuable lessons!

**When to Ask for Help:**
Remember, great leaders know when to seek advice from teachers, parents, or mentors.`,
      tags: ['problem-solving', 'creativity', 'decision-making'],
    },
    {
      id: 5,
      title: 'Building Confidence as a Young Leader',
      category: 'confidence',
      readTime: '4 min read',
      excerpt:
        'Practical strategies to boost your self-confidence and overcome self-doubt.',
      content: `Confidence is like a muscle - the more you exercise it, the stronger it gets:

**Building Self-Confidence:**
• Set small, achievable goals and celebrate when you reach them
• Practice new skills regularly - improvement builds confidence
• Surround yourself with supportive friends and mentors
• Keep a journal of your accomplishments and positive feedback

**Overcoming Fear and Doubt:**
• Remember that everyone feels nervous sometimes - even experienced leaders
• Prepare well for important situations
• Focus on what you can control, not what you can't
• Use positive self-talk: "I can do this" instead of "I can't"

**Learning from Setbacks:**
• View mistakes as learning opportunities, not failures
• Ask yourself: "What can I learn from this?"
• Don't let one bad experience define you
• Keep trying - persistence builds confidence over time`,
      tags: ['confidence', 'self-esteem', 'growth'],
    },
    {
      id: 6,
      title: 'Leading by Example in Your Community',
      category: 'inspiration',
      readTime: '7 min read',
      excerpt:
        'How to inspire positive change in your school, family, and community through your actions.',
      content: `The best leaders don't just talk about change - they create it through their actions:

**Ways to Lead by Example:**
• Be kind and respectful to everyone you meet
• Help classmates who are struggling with schoolwork
• Volunteer for community service projects
• Stand up against bullying and unfair treatment
• Take care of the environment in small but meaningful ways

**Starting Positive Initiatives:**
• Organize study groups to help classmates succeed
• Start a book club or reading program
• Create awareness campaigns about important issues
• Organize fundraisers for good causes
• Mentor younger students

**Making a Lasting Impact:**
• Be consistent in your actions and values
• Inspire others to join your efforts
• Document and share your positive impact
• Always look for new ways to help and improve things

Remember: You don't need a title or position to be a leader. Leadership is about influence, and you can influence others positively every single day!`,
      tags: ['inspiration', 'community', 'impact'],
    },
    {
      id: 7,
      title: 'D - Discipline: The Foundation of Success',
      category: 'drnicer-values',
      readTime: '5 min read',
      excerpt:
        'Learn how discipline helps you achieve your goals and become a reliable leader others can count on.',
      content: `Discipline is the bridge between goals and accomplishment. It's about doing what needs to be done, even when you don't feel like doing it.

**What Discipline Means:**
• Showing up consistently, even when it's hard
• Following through on your commitments
• Managing your time and priorities effectively
• Staying focused on your long-term goals

**Building Discipline:**
• Start with small, daily habits
• Create routines that support your goals
• Remove distractions from your environment
• Celebrate small wins along the way

**Discipline in Leadership:**
• Be punctual and reliable
• Keep your promises to others
• Stay organized and prepared
• Lead by example in your work ethic

Remember: Discipline isn't about being perfect - it's about being consistent!`,
      tags: ['discipline', 'habits', 'consistency', 'drnicer'],
    },
    {
      id: 8,
      title: 'R - Responsibility: Own Your Actions',
      category: 'drnicer-values',
      readTime: '4 min read',
      excerpt:
        'Discover how taking responsibility for your actions builds trust and makes you a stronger leader.',
      content: `Responsibility means being accountable for your actions, decisions, and their consequences. It's a cornerstone of great leadership.

**Taking Responsibility Means:**
• Owning your mistakes without making excuses
• Following through on your commitments
• Being reliable and dependable
• Taking care of your duties and obligations

**How to Be More Responsible:**
• Think before you act or speak
• Keep track of your commitments and deadlines
• Admit when you're wrong and learn from it
• Help others when they need support

**Responsibility as a Leader:**
• Take ownership of team outcomes
• Protect and support your team members
• Make decisions based on what's best for everyone
• Be someone others can depend on

When you take responsibility, people trust you more and want to follow your lead!`,
      tags: ['responsibility', 'accountability', 'trust', 'drnicer'],
    },
    {
      id: 9,
      title: 'N - No-Excuse: Rise Above Challenges',
      category: 'drnicer-values',
      readTime: '4 min read',
      excerpt:
        'Learn how adopting a no-excuse mindset helps you overcome obstacles and achieve your dreams.',
      content: `A no-excuse mindset means focusing on solutions instead of problems. It's about taking control of your life and not letting obstacles stop you.

**No-Excuse Thinking:**
• Focus on what you can control, not what you can't
• Look for solutions instead of dwelling on problems
• Take action even when conditions aren't perfect
• Learn from setbacks instead of giving up

**Overcoming Common Excuses:**
• "I don't have time" → Prioritize and manage your time better
• "It's too hard" → Break it down into smaller steps
• "I'm not good enough" → Practice and improve your skills
• "Others won't help" → Take initiative and lead by example

**Building a No-Excuse Attitude:**
• Set clear goals and work toward them daily
• Surround yourself with positive, motivated people
• Celebrate progress, not just perfection
• Keep learning and growing from every experience

Remember: Excuses will always be there for you, but opportunities won't!`,
      tags: ['no-excuse', 'mindset', 'perseverance', 'drnicer'],
    },
    {
      id: 10,
      title: "I - Integrity: Do What's Right",
      category: 'drnicer-values',
      readTime: '5 min read',
      excerpt:
        'Understand how integrity builds character and makes you a leader people respect and trust.',
      content: `Integrity means doing the right thing, even when no one is watching. It's about aligning your actions with your values.

**What Integrity Looks Like:**
• Being honest in all your dealings
• Keeping your word and promises
• Standing up for what's right, even when it's difficult
• Treating everyone with fairness and respect

**Building Integrity:**
• Be truthful, even when it's uncomfortable
• Admit your mistakes and work to fix them
• Keep confidences and respect others' privacy
• Do quality work, even on small tasks

**Integrity in Leadership:**
• Make decisions based on principles, not popularity
• Be transparent about your intentions and actions
• Treat all team members fairly and equally
• Stand up for others who can't stand up for themselves

**Why Integrity Matters:**
• People trust leaders with integrity
• It builds your reputation over time
• It helps you sleep well at night
• It creates a positive example for others to follow

Your integrity is your most valuable asset - protect it!`,
      tags: ['integrity', 'honesty', 'character', 'drnicer'],
    },
    {
      id: 11,
      title: 'C - Compassion: Lead with Your Heart',
      category: 'drnicer-values',
      readTime: '4 min read',
      excerpt:
        'Discover how compassion makes you a more effective leader and creates stronger relationships.',
      content: `Compassion is the ability to understand and care about others' feelings and experiences. It's what makes leadership truly meaningful.

**Showing Compassion:**
• Listen actively when others share their problems
• Try to understand different perspectives
• Offer help and support when others are struggling
• Be patient with people who are learning or growing

**Compassion in Action:**
• Check on classmates who seem upset or stressed
• Include others who might feel left out
• Offer encouragement when someone is facing challenges
• Celebrate others' successes genuinely

**Benefits of Compassionate Leadership:**
• People feel safe and valued around you
• Teams work better together
• Conflicts are resolved more easily
• You create a positive environment for everyone

**Developing Compassion:**
• Practice putting yourself in others' shoes
• Ask people how they're feeling and really listen
• Look for ways to help without being asked
• Remember that everyone is fighting their own battles

Compassion doesn't make you weak - it makes you a stronger, more effective leader!`,
      tags: ['compassion', 'empathy', 'kindness', 'drnicer'],
    },
    {
      id: 12,
      title: 'E - Excellence: Strive for Your Best',
      category: 'drnicer-values',
      readTime: '5 min read',
      excerpt:
        'Learn how pursuing excellence in everything you do sets you apart as a leader.',
      content: `Excellence isn't about being perfect - it's about consistently giving your best effort and continuously improving.

**What Excellence Means:**
• Doing your best work, even on small tasks
• Continuously learning and improving your skills
• Paying attention to details that matter
• Taking pride in your work and achievements

**Pursuing Excellence:**
• Set high standards for yourself
• Seek feedback and use it to improve
• Practice regularly to develop your skills
• Learn from both successes and failures

**Excellence in Leadership:**
• Model the behavior you want to see in others
• Encourage team members to do their best work
• Recognize and celebrate quality efforts
• Create systems and processes that support excellence

**Building an Excellence Mindset:**
• Focus on progress, not perfection
• Celebrate small improvements along the way
• Learn from people who excel in areas you want to improve
• Remember that excellence is a journey, not a destination

**Why Excellence Matters:**
• It builds your confidence and reputation
• Others are inspired by your commitment to quality
• You achieve better results in everything you do
• It becomes a habit that serves you throughout life

Strive for excellence, and success will follow!`,
      tags: ['excellence', 'quality', 'improvement', 'drnicer'],
    },
    {
      id: 13,
      title: 'R - Respect: Honor Others and Yourself',
      category: 'drnicer-values',
      readTime: '4 min read',
      excerpt:
        'Understand how respect creates positive relationships and makes you a leader others want to follow.',
      content: `Respect is about recognizing the worth and dignity of every person, including yourself. It's fundamental to all healthy relationships.

**Showing Respect:**
• Listen when others are speaking
• Use polite and kind language
• Value different opinions and perspectives
• Treat everyone fairly, regardless of differences

**Respect in Practice:**
• Say "please," "thank you," and "excuse me"
• Don't interrupt when others are talking
• Respect others' property and personal space
• Include everyone and avoid making others feel left out

**Self-Respect:**
• Set healthy boundaries for yourself
• Don't compromise your values to fit in
• Take care of your physical and mental health
• Speak up for yourself when necessary

**Respect as a Leader:**
• Value each team member's contributions
• Create an environment where everyone feels valued
• Address disrespectful behavior when you see it
• Model respectful behavior in all your interactions

**Building Mutual Respect:**
• Treat others the way you want to be treated
• Acknowledge others' achievements and efforts
• Apologize sincerely when you make mistakes
• Stand up for others who are being treated unfairly

When you show respect, you earn respect in return!`,
      tags: ['respect', 'dignity', 'relationships', 'drnicer'],
    },
  ];

  // Fetch articles from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/transcomm/articles');
        const data = await response.json();

        if (data.status) {
          setApiArticles(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Combine static articles with API articles
  const allArticles = [
    ...articles,
    ...apiArticles.map((article, index) => ({
      id: `api-${article._id}`,
      title: article.title,
      category: article.category,
      readTime: article.readTime || '5 min read',
      excerpt: article.excerpt,
      content: article.content,
      tags: article.tags || [],
    })),
  ];

  const filteredArticles =
    selectedCategory === 'all'
      ? allArticles
      : allArticles.filter((article) => article.category === selectedCategory);

  return (
    <>
      <StudentNav />
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>
            👑 TRANSCOMM - Transformational Leadership
          </h1>
          <p className={styles.pageSubtitle}>
            Discover your leadership potential and learn how to make a positive
            impact in your school and community
          </p>
        </div>
        <div className={styles.contentContainer}>
          {/* DRNICER Values Section */}
          <Card title='🏆 DRNICER Values - Our Foundation'>
            <div className={styles.drnicerSection}>
              <p className={styles.drnicerIntro}>
                DRNICER represents the core values that guide us as
                transformational leaders. These values shape our character and
                define how we interact with others.
              </p>
              <div className={styles.drnicerGrid}>
                <div className={styles.drnicerValue}>
                  <div className={styles.drnicerLetter}>D</div>
                  <div className={styles.drnicerContent}>
                    <h4>Discipline</h4>
                    <p>
                      The foundation of success through consistency and
                      commitment
                    </p>
                  </div>
                </div>
                <div className={styles.drnicerValue}>
                  <div className={styles.drnicerLetter}>R</div>
                  <div className={styles.drnicerContent}>
                    <h4>Responsibility</h4>
                    <p>
                      Owning your actions and being accountable for outcomes
                    </p>
                  </div>
                </div>
                <div className={styles.drnicerValue}>
                  <div className={styles.drnicerLetter}>N</div>
                  <div className={styles.drnicerContent}>
                    <h4>No-Excuse</h4>
                    <p>
                      Rising above challenges with a solution-focused mindset
                    </p>
                  </div>
                </div>
                <div className={styles.drnicerValue}>
                  <div className={styles.drnicerLetter}>I</div>
                  <div className={styles.drnicerContent}>
                    <h4>Integrity</h4>
                    <p>Doing what&apos;s right, even when no one is watching</p>
                  </div>
                </div>
                <div className={styles.drnicerValue}>
                  <div className={styles.drnicerLetter}>C</div>
                  <div className={styles.drnicerContent}>
                    <h4>Compassion</h4>
                    <p>Leading with empathy and understanding for others</p>
                  </div>
                </div>
                <div className={styles.drnicerValue}>
                  <div className={styles.drnicerLetter}>E</div>
                  <div className={styles.drnicerContent}>
                    <h4>Excellence</h4>
                    <p>Striving for your best in everything you do</p>
                  </div>
                </div>
                <div className={styles.drnicerValue}>
                  <div className={styles.drnicerLetter}>R</div>
                  <div className={styles.drnicerContent}>
                    <h4>Respect</h4>
                    <p>Honoring the dignity and worth of every person</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Category Filter */}
          <Card title='📂 Explore Leadership Topics'>
            <div className={styles.categoryFilter}>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? 'primary' : 'secondary'
                  }
                  onClick={() => setSelectedCategory(category.id)}
                  className={styles.categoryButton}
                >
                  <span className={styles.categoryIcon}>{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>
          </Card>

          {/* Articles Grid */}
          {loading ? (
            <Card title='Loading Articles...'>
              <div className={styles.loadingContainer}>
                <div className={styles.loader}></div>
                <p>Loading leadership articles...</p>
              </div>
            </Card>
          ) : (
            <div className={styles.articlesGrid}>
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {/* Leadership Quote */}
          <Card title='💭 Leadership Inspiration'>
            <div className={styles.quoteSection}>
              <blockquote className={styles.quote}>
                The greatest leader is not necessarily the one who does the
                greatest things. They are the one that gets the people to do the
                greatest things
              </blockquote>
              <cite className={styles.quoteAuthor}>- Ronald Reagan</cite>
            </div>
          </Card>

          {/* Call to Action */}
          <Card title='🚀 Ready to Lead?'>
            <div className={styles.callToAction}>
              <h3>Start Your Leadership Journey Today!</h3>
              <p>
                Leadership is not about waiting for permission - it is about
                taking action. Here are some ways you can start leading right
                now:
              </p>
              <ul className={styles.actionList}>
                <li>🎯 Set a positive example in your classroom</li>
                <li>🤝 Help a classmate who is struggling</li>
                <li>🌱 Start a small project to improve your school</li>
                <li>📚 Read more books to expand your knowledge</li>
                <li>💬 Practice speaking up for what is right</li>
                <li>🌟 Encourage others to reach their potential</li>
              </ul>
              <p className={styles.encouragement}>
                Remember: Every great leader started exactly where you are now.
                The only difference is they decided to begin!
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

// Article Card Component
function ArticleCard({ article }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card title={article.title} className={styles.articleCard}>
      <div className={styles.articleMeta}>
        <span className={styles.readTime}>⏱️ {article.readTime}</span>
        <div className={styles.tags}>
          {article.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <p className={styles.excerpt}>{article.excerpt}</p>

      {isExpanded && (
        <div className={styles.articleContent}>
          {article.content.split('\n').map((paragraph, index) => {
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return (
                <h4 key={index} className={styles.subheading}>
                  {paragraph.slice(2, -2)}
                </h4>
              );
            }
            if (paragraph.startsWith('•')) {
              return (
                <li key={index} className={styles.listItem}>
                  {paragraph.slice(2)}
                </li>
              );
            }
            if (paragraph.match(/^\d+\./)) {
              return (
                <li key={index} className={styles.numberedItem}>
                  {paragraph}
                </li>
              );
            }
            return paragraph ? (
              <p key={index}>{paragraph}</p>
            ) : (
              <br key={index} />
            );
          })}
        </div>
      )}

      <Button
        variant='primary'
        onClick={() => setIsExpanded(!isExpanded)}
        className={styles.readMoreButton}
      >
        {isExpanded ? '📖 Show Less' : '📚 Read Full Article'}
      </Button>
    </Card>
  );
}
