import questionModel from '../../models/questionModel.js';
import userModel from '../../models/userModel.js';

const getQuestionbyId = async (req, res) => {
    const userId = res.locals.user?.id;
    const id = req.params.id;
    const sort = req.query.sort || 'vote';

    const question = await questionModel.findOne({
        _id: id,
        // status: { $ne: 0 },
        deleted: false,
    });

    if (sort === 'vote') {
        // Sắp xếp theo lượt vote (like - dislike)
        question.reply.sort((a, b) => {
            const aVotes = a.vote.like.length - a.vote.dislike.length;
            const bVotes = b.vote.like.length - b.vote.dislike.length;
            return bVotes - aVotes; // Sắp xếp từ cao đến thấp
        });
    } else if (sort === 'newest') {
        // Sắp xếp theo createdAt mới nhất
        question.reply.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === 'oldest') {
        // Sắp xếp theo createdAt cũ nhất
        question.reply.sort((a, b) => a.createdAt - b.createdAt);
    }

    const user = await userModel
        .findOne({
            _id: question.user_id,
            deleted: false,
        })
        .select('fullName avatar');

    question.user = user;

    for (const reply of question.reply) {
        const user = await userModel
            .findOne({
                _id: reply.user_id,
                deleted: false,
            })
            .select('fullName avatar');

        // Thông tin người trả lời
        reply.user = user;

        if (userId) {
            let vote = 'none';
            for (const like of reply.vote.like) {
                if (like.user_id == userId) {
                    vote = 'like';
                }
            }

            for (const dislike of reply.vote.dislike) {
                if (dislike.user_id == userId) {
                    vote = 'dislike';
                }
            }
            reply.userVote = vote;
        }
    }

    return question;
};

const postReply = async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    // Create By
    data.user_id = res.locals.user.id;

    await questionModel.updateOne(
        {
            _id: id,
            deleted: false,
        },
        {
            $push: { reply: data },
        },
    );

    await userModel.updateOne(
        {
            _id: data.user_id,
        },
        { $inc: { points: +1 } },
    );
};

const voteReply = async (req, res) => {
    const userId = res.locals.user.id;
    const { idQuestion, idReply, type } = req.body;
    const notType = type === 'like' ? 'dislike' : 'like';

    try {
        const question = await questionModel.findOne({
            _id: idQuestion,
            'reply._id': idReply,
            deleted: false,
        });

        if (!question) {
            return {
                status: 404,
                message: 'Câu hỏi hoặc phản hồi không tồn tại.',
            };
        }

        // Tìm reply với idReply
        const reply = question.reply.find((r) => r.id === idReply);
        if (!reply) {
            return {
                status: 404,
                message: 'Phản hồi không tồn tại.',
            };
        }

        // Kiểm tra xem người dùng đã vote kiểu `type` chưa
        if (
            reply.vote[type].some(
                (element) => element.user_id.toString() === userId,
            )
        ) {
            return {
                status: 304,
                message: 'Người dùng đã vote kiểu này rồi.',
            };
        }

        let updateData = {
            $push: {
                [`reply.$.vote.${type}`]: {
                    user_id: userId,
                },
            },
        };

        // Kiểm tra nếu type = like thì cộng point
        if (type == 'like') {
            await userModel.updateOne(
                {
                    _id: reply.user_id,
                },
                { $inc: { points: +1 } },
            );
        } else {
            // Kiểm tra người dùng đã từng like chưa
            const check = reply.vote.like.some(
                (element) => element.user_id.toString() === userId,
            );
            if (check) {
                await userModel.updateOne(
                    {
                        _id: reply.user_id,
                        points: { $gt: 0 },
                    },
                    {
                        $inc: { points: -1 },
                    },
                );
            }
        }

        // Kiểm tra nếu người dùng đã vote kiểu `notType`, nếu có thì pull ở `notType`
        if (
            reply.vote[notType].some(
                (element) => element.user_id.toString() === userId,
            )
        ) {
            updateData = {
                $push: {
                    [`reply.$.vote.${type}`]: {
                        user_id: userId,
                    },
                },
                $pull: {
                    [`reply.$.vote.${notType}`]: {
                        user_id: userId,
                    },
                },
            };
        }

        await questionModel.updateOne(
            {
                _id: idQuestion,
                'reply._id': idReply,
                deleted: false,
            },
            updateData,
        );

        return {
            status: 200,
            message: 'Bình chọn thành công!',
        };
    } catch (error) {
        return {
            status: 500,
            message: 'Đã xảy ra lỗi khi cập nhật bình chọn.',
        };
    }
};

const completeQuestion = async (id) => {
    await questionModel.updateOne(
        {
            _id: id,
            deleted: false,
        },
        {
            status: 1,
        },
    );
};

export default {
    getQuestionbyId,
    postReply,
    voteReply,
    completeQuestion,
};
