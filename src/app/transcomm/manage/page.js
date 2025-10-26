'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import styles from './manage.module.css';

export default function ManageTranscommPage() {
  const [formData, setFormData] = useState({
    title: '',
    category: 'leadership-basics',
    readTime: '',
    excerpt: '',
    content: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  const categories = [
    { value: 'drnicer-values', label: 'DRNICER Values' },
    { value: 'leadership-basics', label: 'Leadership Basics' },
    { value: 'communication', label: 'Communication' },
    { value: 'teamwork', label: 'Teamwork' },
    { value: 'problem-solving', label: 'Problem Solving' },
    { value: 'confidence', label: 'Building Confidence' },
    { value: 'inspiration', label: 'Inspiration' },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.excerpt || !formData.content) {
      setError('Title, excerpt, and content are required.');
      return;
    }

    if (formData.content.length < 200) {
      setError('Content must be at least 200 characters long.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/transcomm/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status) {
        setSuccess(
          `Article "${data.data.title}" created successfully! It will appear on the TRANSCOMM page.`
        );
        setFormData({
          title: '',
          category: 'leadership-basics',
          readTime: '',
          excerpt: '',
          content: '',
          tags: '',
        });
        // The useEffect will automatically refetch articles due to success state change
      } else {
        setError(data.message || 'Failed to create article.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Create article error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'leadership-basics',
      readTime: '',
      excerpt: '',
      content: '',
      tags: '',
    });
    setError('');
    setSuccess('');
  };

  // Fetch existing articles
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setArticlesLoading(true);
        const response = await fetch('/api/transcomm/articles');
        const data = await response.json();

        if (data.status) {
          setArticles(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setArticlesLoading(false);
      }
    };

    fetchArticles();
  }, [success]); // Refetch when a new article is created

  const handleDeleteArticle = async (articleId) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const response = await fetch(`/api/transcomm/articles/${articleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.status) {
        setArticles(articles.filter((article) => article._id !== articleId));
        setSuccess('Article deleted successfully.');
      } else {
        setError(data.message || 'Failed to delete article.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Delete article error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryIcon = (category) => {
    const categoryMap = {
      'drnicer-values': '🏆',
      'leadership-basics': '🌟',
      communication: '💬',
      teamwork: '🤝',
      'problem-solving': '🧩',
      confidence: '💪',
      inspiration: '✨',
    };
    return categoryMap[category] || '📚';
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📝 Manage TRANSCOMM Articles</h1>
        <p className={styles.pageSubtitle}>
          Create and manage leadership articles for students
        </p>
      </div>

      <div className={styles.contentContainer}>
        <Card title='✍️ Create New Article'>
          {error && (
            <Alert type='error' message={error} onClose={() => setError('')} />
          )}
          {success && (
            <Alert
              type='success'
              message={success}
              onClose={() => setSuccess('')}
            />
          )}

          <form onSubmit={handleSubmit} className={styles.articleForm}>
            <div className={styles.formGrid}>
              <Input
                label='Article Title *'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder='Enter a compelling article title'
                required
                autoFocus
              />

              <Select
                label='Category *'
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                options={categories}
                required
              />

              <Input
                label='Read Time'
                value={formData.readTime}
                onChange={(e) => handleInputChange('readTime', e.target.value)}
                placeholder='e.g., 5 min read'
              />

              <Input
                label='Tags (comma-separated)'
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder='e.g., leadership, teamwork, communication'
              />
            </div>

            <div className={styles.textareaSection}>
              <label className={styles.label}>
                Article Excerpt *
                <span className={styles.characterCount}>
                  ({formData.excerpt.length} characters)
                </span>
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                placeholder='Write a brief, engaging summary of the article (2-3 sentences)'
                className={styles.excerptTextarea}
                rows={3}
                required
              />
            </div>

            <div className={styles.textareaSection}>
              <label className={styles.label}>
                Article Content *
                <span className={styles.characterCount}>
                  ({formData.content.length} characters)
                </span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder='Write the full article content here. Use **text** for bold headings and • for bullet points.'
                className={styles.contentTextarea}
                rows={15}
                required
                minLength={200}
              />
              <div className={styles.characterFeedback}>
                {formData.content.length < 200 ? (
                  <span className={styles.characterWarning}>
                    ⚠️ You need {200 - formData.content.length} more characters
                  </span>
                ) : (
                  <span className={styles.characterSuccess}>
                    ✅ Content length is sufficient
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formActions}>
              <Button
                type='button'
                variant='secondary'
                onClick={resetForm}
                disabled={loading}
              >
                Clear Form
              </Button>
              <Button
                type='submit'
                variant='primary'
                disabled={loading || formData.content.length < 200}
              >
                {loading ? 'Creating Article...' : 'Create Article'}
              </Button>
            </div>
          </form>
        </Card>

        <Card title='� Erxisting Articles'>
          {articlesLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No articles created yet. Create your first article above!</p>
            </div>
          ) : (
            <div className={styles.articlesTable}>
              {articles.map((article) => (
                <div key={article._id} className={styles.articleRow}>
                  <div className={styles.articleInfo}>
                    <div className={styles.articleHeader}>
                      <h4 className={styles.articleTitle}>
                        {getCategoryIcon(article.category)} {article.title}
                      </h4>
                      <div className={styles.articleMeta}>
                        <Badge variant='secondary'>{article.category}</Badge>
                        <span className={styles.articleDate}>
                          Created: {formatDate(article.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className={styles.articleExcerpt}>{article.excerpt}</p>
                    <div className={styles.articleStats}>
                      <span>👁️ {article.viewCount || 0} views</span>
                      <span>📝 By {article.author}</span>
                      <span>🏷️ {article.tags?.length || 0} tags</span>
                    </div>
                  </div>
                  <div className={styles.articleActions}>
                    <Button
                      variant='danger'
                      size='sm'
                      onClick={() => handleDeleteArticle(article._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title='📋 Writing Guidelines'>
          <div className={styles.guidelines}>
            <h4>Content Guidelines:</h4>
            <ul>
              <li>Write for students under 18 years old</li>
              <li>Use simple, clear language that's easy to understand</li>
              <li>Include practical examples and actionable advice</li>
              <li>Keep content positive and encouraging</li>
              <li>Use **text** for bold subheadings</li>
              <li>Use • for bullet points</li>
              <li>
                Use numbered lists (1., 2., 3.) for step-by-step instructions
              </li>
            </ul>

            <h4>Formatting Tips:</h4>
            <ul>
              <li>Start with an engaging introduction</li>
              <li>Break content into digestible sections</li>
              <li>End with a memorable conclusion or call to action</li>
              <li>Use examples that relate to school and student life</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
