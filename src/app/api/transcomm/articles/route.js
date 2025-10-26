import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import TranscommArticle from '@/models/TranscommArticleModel';

// Create new article (POST)
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { title, category, readTime, excerpt, content, tags } = body;

    // Validation
    if (!title || !category || !excerpt || !content) {
      return NextResponse.json(
        {
          status: false,
          message: 'Title, category, excerpt, and content are required.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    if (content.length < 200) {
      return NextResponse.json(
        {
          status: false,
          message: 'Content must be at least 200 characters long.',
        },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    // Process tags
    const processedTags = tags
      ? tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    // Create article
    const article = await TranscommArticle.create({
      title: title.trim(),
      category,
      readTime: readTime?.trim() || '',
      excerpt: excerpt.trim(),
      content: content.trim(),
      tags: processedTags,
      author: auth.user.name || auth.user.email,
    });

    return NextResponse.json(
      {
        status: true,
        message: 'Article created successfully!',
        data: {
          id: article._id,
          title: article.title,
          category: article.category,
          author: article.author,
        },
      },
      { status: StatusCodes.CREATED }
    );
  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to create article.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// Get articles (GET)
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('active') !== 'false'; // Default to true
    const limit = parseInt(searchParams.get('limit')) || 50;

    let query = { isActive };

    if (category && category !== 'all') {
      query.category = category;
    }

    const articles = await TranscommArticle.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');

    return NextResponse.json(
      {
        status: true,
        message: 'Articles fetched successfully.',
        data: articles,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Fetch articles error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch articles.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
