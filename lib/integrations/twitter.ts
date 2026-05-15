/**
 * Twitter Integration
 * Fetches social metrics for projects
 */

const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || '';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || '';

export interface TwitterMetrics {
  followersCount: number;
  tweetsCount: number;
  engagementRate: number;
  organicGrowthRate: number;
  sentimentScore: number;
  isVerified: boolean;
}

/**
 * Get Twitter user metrics
 */
export async function getTwitterMetrics(handle: string): Promise<TwitterMetrics | null> {
  try {
    if (!TWITTER_BEARER_TOKEN) {
      console.warn('Twitter API token not configured');
      return null;
    }

    // Get user info
    const userResponse = await fetch(`https://api.twitter.com/2/users/by/username/${handle}`, {
      headers: {
        Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Twitter user lookup failed:', userResponse.statusText);
      return null;
    }

    const userData = await userResponse.json();
    const userId = userData.data.id;

    // Get tweets for last 30 days
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics,created_at`,
      {
        headers: {
          Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    const tweetsData = await tweetsResponse.json();
    const tweets = tweetsData.data || [];

    // Calculate metrics
    const followersCount = userData.data.public_metrics.followers_count;
    const tweetsCount = userData.data.public_metrics.tweet_count;

    // Engagement rate
    let totalEngagement = 0;
    tweets.forEach((tweet: any) => {
      totalEngagement += tweet.public_metrics.like_count + tweet.public_metrics.retweet_count;
    });
    const engagementRate = tweets.length > 0 ? (totalEngagement / tweets.length) / followersCount : 0;

    // Organic growth rate (tweets in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTweets = tweets.filter(
      (t: any) => new Date(t.created_at) > sevenDaysAgo
    );
    const organicGrowthRate = recentTweets.length / 7; // tweets per day

    return {
      followersCount,
      tweetsCount,
      engagementRate,
      organicGrowthRate,
      sentimentScore: 0.5, // Would require NLP
      isVerified: userData.data.verified,
    };
  } catch (error) {
    console.error('Twitter metrics error:', error);
    return null;
  }
}

/**
 * Get related community metrics (Telegram, Discord)
 */
export async function getCommunityMetrics(projectName: string): Promise<{
  telegramMembers: number;
  discordMembers: number;
  communityEngagement: number;
}> {
  try {
    // This would integrate with Telegram Bot API and Discord API
    // For now, returning template
    return {
      telegramMembers: 0,
      discordMembers: 0,
      communityEngagement: 0,
    };
  } catch (error) {
    console.error('Community metrics error:', error);
    return {
      telegramMembers: 0,
      discordMembers: 0,
      communityEngagement: 0,
    };
  }
}
