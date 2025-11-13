interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
    };
    priority?: {
      name: string;
    };
  };
}

export async function syncCardToJira(
  cardId: string,
  cardData: {
    title: string;
    description: string;
    priority: string;
  },
  accessToken: string
) {
  const jiraUrl = `${process.env.JIRA_SITE_URL}/rest/api/3/issue`;

  try {
    const response = await fetch(jiraUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: "TASK", // Your Jira project key
          },
          summary: cardData.title,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: cardData.description || "",
                  },
                ],
              },
            ],
          },
          issuetype: {
            name: "Task",
          },
          priority: {
            name: cardData.priority || "Medium",
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.statusText}`);
    }

    const jiraIssue: JiraIssue = await response.json();
    return jiraIssue;
  } catch (error) {
    console.error("Error syncing to Jira:", error);
    return null;
  }
}

export async function getJiraIssues(accessToken: string) {
  const jiraUrl = `${process.env.JIRA_SITE_URL}/rest/api/3/search?jql=project=TASK`;

  try {
    const response = await fetch(jiraUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.issues;
  } catch (error) {
    console.error("Error fetching Jira issues:", error);
    return [];
  }
}