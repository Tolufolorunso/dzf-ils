import { NextResponse } from 'next/server';
import { StatusCodes } from 'http-status-codes';
import { dbConnect } from '@/lib/dbConnect';
import { verifyAuth } from '@/lib/auth';
import TranscommArticle from '@/models/TranscommArticleModel';

// Get single article (GET)
export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { status: false, message: 'Article ID is required.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const article = await TranscommArticle.findById(id);

    if (!article) {
      return NextResponse.json(
        { status: false, message: 'Article not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Increment view count
    await TranscommArticle.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    return NextResponse.json(
      {
        status: true,
        message: 'Article fetched successfully.',
        data: article,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Fetch article error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to fetch article.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// Update article (PATCH)
export async function PATCH(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { status: false, message: 'Article ID is required.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const article = await TranscommArticle.findById(id);

    if (!article) {
      return NextResponse.json(
        { status: false, message: 'Article not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Process tags if provided
    if (body.tags && typeof body.tags === 'string') {
      body.tags = body.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    // Update article
    const updatedArticle = await TranscommArticle.findByIdAndUpdate(
      id,
      { ...body },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        status: true,
        message: 'Article updated successfully.',
        data: updatedArticle,
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to update article.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}

// Delete article (DELETE)
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.status) {
      return NextResponse.json(
        { status: false, message: auth.message },
        { status: auth.statusCode || StatusCodes.UNAUTHORIZED }
      );
    }

    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { status: false, message: 'Article ID is required.' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    const article = await TranscommArticle.findById(id);

    if (!article) {
      return NextResponse.json(
        { status: false, message: 'Article not found.' },
        { status: StatusCodes.NOT_FOUND }
      );
    }

    // Soft delete by setting isActive to false
    await TranscommArticle.findByIdAndUpdate(id, { isActive: false });

    return NextResponse.json(
      {
        status: true,
        message: 'Article deleted successfully.',
      },
      { status: StatusCodes.OK }
    );
  } catch (error) {
    console.error('Delete article error:', error);
    return NextResponse.json(
      {
        status: false,
        message: 'Failed to delete article.',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    );
  }
}
